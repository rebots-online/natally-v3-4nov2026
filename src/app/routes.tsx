// §9.1: the whole route table. Everything that lands in a later task is found through import.meta.glob, so an absent file
// never breaks the build: an absent screen falls through to NotFound, an absent gate or shell module is simply not used.
//
// What this file expects of those files:
//   ./Gate.tsx           default export, a component with props { gates: ('A'|'B'|'V')[]; children }
//   ./ErrorBoundary.tsx  default export, a class component with props { children }; route errors are rethrown to it
//   ./lifecycle.ts, ./pwa.ts  an optional default export function, called once after mount
//   ../modalities/index.ts    allModalityRoutes (§5.15); ../analytics/index.ts track; ../ui/index.ts ToastHost
//   screens              default export (§9.1)
import { Component, lazy, Suspense, useEffect, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Outlet, useMatches, useRouteError, type RouteObject } from 'react-router-dom';
import { config } from '../config';
import type { AnalyticsCatalog, ModalityRoute } from '../types';
import NotFound from './NotFound';

type GateKey = 'A' | 'B' | 'V';
type Lazy = () => Promise<{ default: ComponentType }>;
type Starter = { default?: () => void };

const screens = import.meta.glob<{ default: ComponentType }>([
  '../landing/ScreenLanding.tsx',
  '../modalities/ScreenPickModality.tsx',
  '../auth/ScreenSignIn.tsx',
  '../auth/ScreenDesktopBridge.tsx',
  '../billing/ScreenCheckout.tsx',
  '../billing/ScreenTopUp.tsx',
  '../account/ScreenProfile.tsx',
  '../info/ScreenSettings.tsx',
  '../info/ScreenAbout.tsx',
  '../info/ScreenLegal.tsx',
  '../souvenir/ScreenSouvenirOffer.tsx',
  '../share/ScreenSharedChart.tsx',
]);
const gateModule = import.meta.glob<{ default: ComponentType<{ gates: GateKey[]; children: ReactNode }> }>('./Gate.tsx');
const boundaryModule = import.meta.glob<{ default: ComponentType<{ children: ReactNode }> }>('./ErrorBoundary.tsx', { eager: true });
const starters = import.meta.glob<Starter>(['./lifecycle.ts', './pwa.ts']);
const modalities = import.meta.glob<{ allModalityRoutes(): Promise<ModalityRoute[]> }>('../modalities/index.ts');
const analytics = import.meta.glob<{ track<K extends keyof AnalyticsCatalog>(name: K, params: AnalyticsCatalog[K]): void }>('../analytics/index.ts');
const ui = import.meta.glob<{ ToastHost: ComponentType }>('../ui/index.ts');

const APP_ROUTES: { path: string; screen: string; gates?: GateKey[] }[] = [
  { path: '/', screen: '../landing/ScreenLanding.tsx' },
  { path: '/pick', screen: '../modalities/ScreenPickModality.tsx' },
  { path: '/sign-in', screen: '../auth/ScreenSignIn.tsx' },
  { path: '/auth/desktop', screen: '../auth/ScreenDesktopBridge.tsx' },
  { path: '/checkout', screen: '../billing/ScreenCheckout.tsx', gates: ['A'] },
  { path: '/top-up', screen: '../billing/ScreenTopUp.tsx', gates: ['A'] },
  { path: '/profile', screen: '../account/ScreenProfile.tsx', gates: ['A'] },
  { path: '/settings', screen: '../info/ScreenSettings.tsx' },
  { path: '/about', screen: '../info/ScreenAbout.tsx' },
  { path: '/legal/:doc', screen: '../info/ScreenLegal.tsx' },
  { path: '/souvenir', screen: '../souvenir/ScreenSouvenirOffer.tsx', gates: ['A'] },
  { path: '/shared/:shareId', screen: '../share/ScreenSharedChart.tsx' },
];

const Missing = () => <NotFound version={config.version} />;

const loadGate = gateModule['./Gate.tsx'];
const Gate = loadGate ? lazy(loadGate) : ({ children }: { gates: GateKey[]; children: ReactNode }) => <>{children}</>;

const loadToasts = ui['../ui/index.ts'];
const Toasts = loadToasts
  ? lazy(async () => {
      const { ToastHost } = await loadToasts();
      return { default: ToastHost };
    })
  : () => null;

/** §16.5: a route chunk that loaded clears the reload guard. */
function lazyScreen(load: Lazy) {
  return lazy(async () => {
    const screen = await load();
    sessionStorage.removeItem('natally.chunkReloaded');
    return screen;
  });
}

function routeObject(path: string, load: Lazy | undefined, gates: GateKey[]): RouteObject {
  if (!load) return { id: path, path, element: <Missing /> };
  const Screen = lazyScreen(load);
  return {
    id: path,
    path,
    element: gates.length > 0 ? <Gate gates={gates}><Screen /></Gate> : <Screen />,
  };
}

function RootLayout() {
  // The route pattern, not the address: a path can hold an element or share id, and events carry no personal data (§15.1).
  const screen = useMatches().at(-1)?.id ?? '';
  useEffect(() => {
    void analytics['../analytics/index.ts']?.().then(({ track }) => track('screen_view', { screen }));
  }, [screen]);
  return (
    <Suspense fallback={null}>
      <Outlet />
      <Toasts />
    </Suspense>
  );
}

function RethrowRouteError(): ReactNode {
  throw useRouteError();
}

async function modalityRoutes(): Promise<RouteObject[]> {
  const load = modalities['../modalities/index.ts'];
  if (!load) return [];
  const { allModalityRoutes } = await load();
  return (await allModalityRoutes()).map((route) => {
    const gates: GateKey[] = [];
    if (route.requiresAuth) gates.push('A');
    if (route.requiresBirth) gates.push('B');
    if (route.requiresVoiceStep) gates.push('V');
    return routeObject(route.path, route.load, gates);
  });
}

export async function createAppRouter() {
  return createBrowserRouter([
    {
      id: 'root',
      element: <RootLayout />,
      errorElement: <RethrowRouteError />,
      children: [
        ...APP_ROUTES.map((r) => routeObject(r.path, screens[r.screen], r.gates ?? [])),
        ...(await modalityRoutes()),
        { id: '*', path: '*', element: <Missing /> },
      ],
    },
  ]);
}

export function startShellModules() {
  for (const load of Object.values(starters)) void load().then((m) => m.default?.());
}

class FallbackBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? <Missing /> : this.props.children;
  }
}

export const AppBoundary = boundaryModule['./ErrorBoundary.tsx']?.default ?? FallbackBoundary;
