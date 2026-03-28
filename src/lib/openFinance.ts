/**
 * Provider abstraction for bank linking (G-001). Implement per region.
 */
export interface BankLinkProvider {
  id: string;
  displayName: string;
  supportedRegions: string[];
}

export const BANK_LINK_PROVIDERS_PLACEHOLDER: BankLinkProvider[] = [
  { id: 'plaid', displayName: 'Plaid (US)', supportedRegions: ['US'] },
  { id: 'tink', displayName: 'Tink (EU)', supportedRegions: ['EU'] },
];
