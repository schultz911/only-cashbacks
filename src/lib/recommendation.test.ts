import { describe, it, expect } from 'vitest';
import { getRecommendations } from './recommendation';

describe('Movie offers recommendation logic', () => {
  it('displays both BMS and District offers for specific cinema merchants like PVR', () => {
    const res = getRecommendations(
      { name: 'PVR Cinemas', category: 'Movies', isOnline: true },
      500
    );
    expect(res).not.toBeNull();
    const offerIds = res!.availableOffers?.map(o => o.id) || [];
    expect(offerIds).toContain('k-bms'); // Kotak 811 BookMyShow offer
    expect(offerIds).toContain('a-district'); // Axis MyZone District offer
  });

  it('displays both BMS and District offers for Cinepolis', () => {
    const res = getRecommendations(
      { name: 'Cinepolis', category: 'Movies', isOnline: true },
      500
    );
    expect(res).not.toBeNull();
    const offerIds = res!.availableOffers?.map(o => o.id) || [];
    expect(offerIds).toContain('k-bms');
    expect(offerIds).toContain('a-district');
  });

  it('displays BMS offers but NOT District offers when looking for BookMyShow', () => {
    const res = getRecommendations(
      { name: 'BookMyShow', category: 'Movies', isOnline: true },
      500
    );
    expect(res).not.toBeNull();
    const offerIds = res!.availableOffers?.map(o => o.id) || [];
    expect(offerIds).toContain('k-bms');
    expect(offerIds).not.toContain('a-district');
  });

  it('displays District offers but NOT BMS offers when looking for District', () => {
    const res = getRecommendations(
      { name: 'District app', category: 'Movies', isOnline: true },
      500
    );
    expect(res).not.toBeNull();
    const offerIds = res!.availableOffers?.map(o => o.id) || [];
    expect(offerIds).toContain('a-district');
    expect(offerIds).not.toContain('k-bms');
  });
});
