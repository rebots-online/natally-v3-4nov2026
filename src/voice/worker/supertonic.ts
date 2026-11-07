// §12.5, following the repo's model card: tokenise, encode, denoise latents, decode, trim. One sentence at a time.
import { Tokenizer } from '@huggingface/tokenizers';
import type { InferenceSession, Tensor } from 'onnxruntime-web';

type Ort = typeof import('onnxruntime-web');
type Read = (repoPath: string) => Promise<Uint8Array>;

const SAMPLE_RATE = 44100;
const LATENT_SIZE = 512 * 6;
const LATENT_CHANNELS = 24 * 6;
const STYLE_DIM = 128;
export const SESSIONS_TOTAL = 3;

export class SynthCancelled extends Error {}

const longTensor = (ort: Ort, values: ArrayLike<number>, dims: number[]): Tensor =>
  new ort.Tensor('int64', BigInt64Array.from(Array.from(values), (v) => BigInt(v)), dims);

/** Standard normal noise. */
function gaussian(length: number): Float32Array {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 2) {
    const radius = Math.sqrt(-2 * Math.log(1 - Math.random()));
    const angle = 2 * Math.PI * Math.random();
    out[i] = radius * Math.cos(angle);
    if (i + 1 < length) out[i + 1] = radius * Math.sin(angle);
  }
  return out;
}

/** The tokenizer's normalizer drops what it has no symbol for; curly quotes would take their apostrophes with them. */
function speakable(text: string): string {
  const straight = text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').trim();
  return /[.!?]["')\]]*$/.test(straight) ? straight : `${straight}.`;
}

export class Supertonic {
  private constructor(
    private readonly ort: Ort,
    private readonly tokenizer: Tokenizer,
    private readonly style: Tensor,
    private readonly encoder: InferenceSession,
    private readonly denoiser: InferenceSession,
    private readonly decoder: InferenceSession,
  ) {}

  static async create(ort: Ort, read: Read, voiceId: string, backend: 'wasm' | 'webgpu', onSession: (loaded: number) => void): Promise<Supertonic> {
    const text = async (path: string): Promise<object> => JSON.parse(new TextDecoder().decode(await read(path))) as object;
    const tokenizer = new Tokenizer(await text('tokenizer.json'), await text('tokenizer_config.json'));
    const voice = await read(`voices/${voiceId}.bin`);
    const floats = new Float32Array(voice.buffer.slice(voice.byteOffset, voice.byteOffset + voice.byteLength) as ArrayBuffer);
    const style = new ort.Tensor('float32', floats, [1, floats.length / STYLE_DIM, STYLE_DIM]);

    const sessions: InferenceSession[] = [];
    for (const name of ['text_encoder', 'latent_denoiser', 'voice_decoder']) {
      const model = await read(`onnx/${name}.onnx`);
      const weights = await read(`onnx/${name}.onnx_data`);
      sessions.push(
        await ort.InferenceSession.create(model, {
          executionProviders: [backend],
          graphOptimizationLevel: 'all',
          externalData: [{ path: `${name}.onnx_data`, data: weights }],
        }),
      );
      onSession(sessions.length);
    }
    return new Supertonic(ort, tokenizer, style, sessions[0]!, sessions[1]!, sessions[2]!);
  }

  async synth(text: string, steps: number, speed: number, cancelled: () => boolean): Promise<Float32Array> {
    const { ort } = this;
    const { ids } = this.tokenizer.encode(speakable(text));
    if (ids.length === 0) return new Float32Array(0);
    const tokens = ids.length;
    const inputIds = longTensor(ort, ids, [1, tokens]);
    const attentionMask = longTensor(ort, new Array<number>(tokens).fill(1), [1, tokens]);

    const encoded = await this.encoder.run({ input_ids: inputIds, attention_mask: attentionMask, style: this.style });
    const [hiddenName, durationName] = this.encoder.outputNames as [string, string];
    const raw = (encoded[durationName]!.data as Float32Array)[0]!;
    const durationSamples = Math.floor((raw / speed) * SAMPLE_RATE);
    const length = Math.max(1, Math.ceil(durationSamples / LATENT_SIZE));

    const latentMask = longTensor(ort, new Array<number>(length).fill(1), [1, length]);
    const stepsTensor = new ort.Tensor('float32', Float32Array.of(steps), [1]);
    let latents: Tensor = new ort.Tensor('float32', gaussian(LATENT_CHANNELS * length), [1, LATENT_CHANNELS, length]);
    const denoisedName = this.denoiser.outputNames[0]!;
    for (let step = 0; step < steps; step += 1) {
      if (cancelled()) throw new SynthCancelled();
      const out = await this.denoiser.run({
        noisy_latents: latents,
        latent_mask: latentMask,
        style: this.style,
        encoder_outputs: encoded[hiddenName]!,
        attention_mask: attentionMask,
        timestep: new ort.Tensor('float32', Float32Array.of(step), [1]),
        num_inference_steps: stepsTensor,
      });
      latents = out[denoisedName]!;
    }
    if (cancelled()) throw new SynthCancelled();
    const decoded = await this.decoder.run({ latents });
    const wave = decoded[this.decoder.outputNames[0]!]!.data as Float32Array;
    return wave.slice(0, length * LATENT_SIZE);
  }

  async release(): Promise<void> {
    await Promise.allSettled([this.encoder.release(), this.denoiser.release(), this.decoder.release()]);
  }
}
