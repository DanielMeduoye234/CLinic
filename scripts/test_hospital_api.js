async function testNearbyEndpoint() {
  console.log('Testing /api/hospitals/nearby with precise coordinates...');
  const lat = 6.4541;
  const lng = 3.3947;

  const url = `http://localhost:3000/api/hospitals/nearby?lat=${lat}&lng=${lng}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API returned HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  console.log('API Success:', data.success);
  console.log('User Location:', data.userLocation);
  console.log('Total Facilities Found:', data.count);
  console.log('Under 1km Count:', data.under1kmCount);

  if (!data.hospitals || data.hospitals.length === 0) {
    throw new Error('No hospitals returned from API');
  }

  // Verify sort order
  for (let i = 0; i < data.hospitals.length - 1; i++) {
    const cur = data.hospitals[i].distanceKm;
    const next = data.hospitals[i + 1].distanceKm;
    if (cur > next) {
      throw new Error(`Hospitals are NOT sorted by distance: ${cur} km came before ${next} km`);
    }
  }

  console.log('\nTop 5 Closest Facilities:');
  data.hospitals.slice(0, 5).forEach((h, idx) => {
    console.log(`  #${idx + 1}: ${h.name} (${h.type}) - ${h.distanceKm} km (${h.distanceMeters}m) [isUnder1km: ${h.isUnder1km}]`);
  });

  const under1kmList = data.hospitals.filter(h => h.isUnder1km);
  console.log(`\nVerified: Found ${under1kmList.length} facilities < 1km! Nearest is ${data.hospitals[0].name} at ${data.hospitals[0].distanceMeters} meters away.`);
}

testNearbyEndpoint().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
