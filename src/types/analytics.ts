// The event catalogue of §15.2. Parameters are scalar and never carry personal data.
export interface AnalyticsCatalog {
  screen_view: { screen: string };
  landing_section_view: { section: string };
  offer_view: { offer: 'souvenir' | 'credits'; surface: string };
  landing_cta_click: { button: string; product_role: string };
  install_click: { store: 'play' | 'windows' | 'linux' };
  modality_choose: { modality: string };
  sign_up: { method: string };
  login: { method: string };
  signin_failed: { method: string; code: string };
  birth_details_submit: { time_known: boolean };
  chart_calculated: { house_system: string; reason: string; ms: number };
  lesson_view: { kind: string; key: string };
  reading_request: { kind: string; has_focus: boolean };
  reading_refused: { reason: string };
  reading_result: { kind: string; outcome: string; model: string; sentences: number; first_sentence_ms: number; resumes: number };
  paywall_view: { surface: string };
  checkout_start: { role: string; product_id: string; rail: string };
  checkout_result: { role: string; product_id: string; rail: string; outcome: string };
  credits_granted: { credited: number; trigger: string };
  purchase: { transaction_id: string; items_count: number; role: string; value?: number; currency?: string };
  souvenir_offer_view: Record<string, never>;
  souvenir_stage: { stage: string; ms: number };
  souvenir_ready: { had_audio: boolean; pages: number };
  souvenir_failed: { stage: string };
  voice_setup_start: { retune: boolean };
  voice_download_done: { bytes: number; ms: number };
  voice_calibrated: { real_time_factor: number; workers: number; threads: number; backend: string; steps: number; sentences_ahead: number; device_memory: number; cores: number };
  voice_skipped: Record<string, never>;
  voice_error: { stage: string; category: string };
  share_action: { action: string };
  setting_change: { setting: string; value: boolean | number };
  page_speed: { metric: 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB'; value: number };
  app_error: { kind: string; hash: string };
  pwa_update_applied: { from_version: string };
}

export const ANALYTICS_EVENT_NAMES = [
  'screen_view', 'landing_section_view', 'offer_view', 'landing_cta_click', 'install_click', 'modality_choose',
  'sign_up', 'login', 'signin_failed', 'birth_details_submit', 'chart_calculated', 'lesson_view',
  'reading_request', 'reading_refused', 'reading_result', 'paywall_view', 'checkout_start', 'checkout_result',
  'credits_granted', 'purchase', 'souvenir_offer_view', 'souvenir_stage', 'souvenir_ready', 'souvenir_failed',
  'voice_setup_start', 'voice_download_done', 'voice_calibrated', 'voice_skipped', 'voice_error', 'share_action',
  'setting_change', 'page_speed', 'app_error', 'pwa_update_applied',
] as const satisfies readonly (keyof AnalyticsCatalog)[];
