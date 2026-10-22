import { environment } from '../../../environments/environment';
export function esApi(url: string): boolean {
  const base = environment.apiUrl.replace(/\/$/, '');
  return url === base || url.startsWith(base + '/') || url.startsWith(base + '?');
}
export function esLogin(url: string): boolean {
  return url.split('?')[0] === `${environment.apiUrl}/auth/login`;
}
