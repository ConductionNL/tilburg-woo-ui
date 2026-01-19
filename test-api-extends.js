/**
 * Test script om te kijken of de _extend parameters werken voor de API calls
 * Dit script test de volgende endpoints:
 * 1. Referentiecomponenten met _extend voor aanbevolenStandaarden en verplichteStandaarden
 * 2. Standaarden met _extend voor standaardVersies
 */

const axios = require('axios');

const baseURL = 'http://localhost:3000/api/apps/openregister/api/objects/vng-gemma/element';

async function testAPI() {
  console.log('🧪 Testing API calls with _extend parameters...\n');

  // Test 1: Referentiecomponenten met extends
  console.log('📋 Test 1: Fetching Referentiecomponenten with _extend parameters');
  try {
    const url1 = `${baseURL}?_limit=2&_page=1&gemmaType=Referentiecomponent&_extend[]=@self.schema&_extend[]=aanbevolenStandaarden&_extend[]=verplichteStandaarden&_published=false`;
    console.log(`   URL: ${url1}\n`);
    
    const response1 = await axios.get(url1, {
      headers: {
        'Cookie': 'connect.sid=your-session-cookie-here'  // Je moet de session cookie uit de browser halen
      }
    });

    if (response1.data && response1.data.results && response1.data.results.length > 0) {
      const first = response1.data.results[0];
      console.log(`✅ Received ${response1.data.results.length} referentiecomponenten`);
      console.log(`\n   First item structure:`);
      console.log(`   - @self.name: ${first?.['@self']?.name || 'NOT FOUND'}`);
      console.log(`   - aanbevolenStandaarden: ${first?.aanbevolenStandaarden ? `Array with ${first.aanbevolenStandaarden.length} items` : 'NOT FOUND'}`);
      console.log(`   - verplichteStandaarden: ${first?.verplichteStandaarden ? `Array with ${first.verplichteStandaarden.length} items` : 'NOT FOUND'}`);
      
      if (first?.aanbevolenStandaarden && first.aanbevolenStandaarden.length > 0) {
        console.log(`\n   First aanbevolenStandaard structure:`);
        const firstStandaard = first.aanbevolenStandaarden[0];
        console.log(`   - Is it an ID/UUID? ${typeof firstStandaard === 'string' ? 'YES ❌' : 'NO ✅'}`);
        console.log(`   - Has @self? ${firstStandaard?.['@self'] ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   - Has standaardVersies? ${firstStandaard?.standaardVersies ? 'YES ✅' : 'NO ❌'}`);
        if (firstStandaard?.['@self']?.name) {
          console.log(`   - @self.name: ${firstStandaard['@self'].name}`);
        }
      }
    } else {
      console.log('❌ No results found');
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.data?.message?.includes('not logged in')) {
      console.log('❌ Not logged in - need session cookie');
      console.log('   To get the session cookie:');
      console.log('   1. Open browser DevTools (F12)');
      console.log('   2. Go to Application > Cookies > http://localhost:3000');
      console.log('   3. Copy the value of "connect.sid" cookie');
      console.log('   4. Replace it in this script\n');
    } else {
      console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test 2: Standaarden met extends
  console.log('📋 Test 2: Fetching Standaarden with _extend parameters');
  try {
    const url2 = `${baseURL}?_limit=2&_page=1&gemmaType=Standaard&_extend[]=@self.schema&_extend[]=standaardVersies&_published=false`;
    console.log(`   URL: ${url2}\n`);
    
    const response2 = await axios.get(url2, {
      headers: {
        'Cookie': 'connect.sid=your-session-cookie-here'
      }
    });

    if (response2.data && response2.data.results && response2.data.results.length > 0) {
      const first = response2.data.results[0];
      console.log(`✅ Received ${response2.data.results.length} standaarden`);
      console.log(`\n   First item structure:`);
      console.log(`   - @self.name: ${first?.['@self']?.name || 'NOT FOUND'}`);
      console.log(`   - standaardVersies: ${first?.standaardVersies ? `Array with ${first.standaardVersies.length} items` : 'NOT FOUND'}`);
      
      if (first?.standaardVersies && first.standaardVersies.length > 0) {
        console.log(`\n   First standaardVersie structure:`);
        const firstVersie = first.standaardVersies[0];
        console.log(`   - Is it an ID/UUID? ${typeof firstVersie === 'string' ? 'YES ❌' : 'NO ✅'}`);
        console.log(`   - Has @self? ${firstVersie?.['@self'] ? 'YES ✅' : 'NO ❌'}`);
        if (firstVersie?.['@self']?.name) {
          console.log(`   - @self.name: ${firstVersie['@self'].name}`);
        }
      }
    } else {
      console.log('❌ No results found');
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.data?.message?.includes('not logged in')) {
      console.log('❌ Not logged in - need session cookie');
    } else {
      console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 CONCLUSIE:');
  console.log('Als de _extend parameters werken, zouden we volledige objecten moeten zien');
  console.log('in plaats van alleen IDs/UUIDs voor aanbevolenStandaarden, verplichteStandaarden');
  console.log('en standaardVersies.\n');
}

testAPI();
