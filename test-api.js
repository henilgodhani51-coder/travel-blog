const http = require('http');
const { db, initDatabase } = require('./db/database');

async function runTests() {
  console.log('--- Starting WanderWave Automated API Verification ---');

  // Start server on a test port
  process.env.PORT = '3045';
  const serverModule = require('./server');

  // Wait 600ms for server to bind
  await new Promise(resolve => setTimeout(resolve, 600));

  function get(urlPath) {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:3045${urlPath}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch(e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }).on('error', reject);
    });
  }

  function post(urlPath, payload) {
    return new Promise((resolve, reject) => {
      const dataStr = JSON.stringify(payload);
      const req = http.request(`http://localhost:3045${urlPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataStr)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch(e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      req.write(dataStr);
      req.end();
    });
  }

  try {
    // Test 1: GET /api/posts
    const allPosts = await get('/api/posts');
    console.log(`Test 1 [GET /api/posts]: status=${allPosts.status}, count=${allPosts.body.count}`);
    if (allPosts.status !== 200 || allPosts.body.count < 6) throw new Error('Test 1 failed');

    // Test 2: Filter by Europe
    const europePosts = await get('/api/posts?continent=Europe');
    console.log(`Test 2 [Filter by Europe]: status=${europePosts.status}, count=${europePosts.body.count}`);
    if (europePosts.status !== 200 || europePosts.body.count < 2) throw new Error('Test 2 failed');

    // Test 3: Search keyword "Patagonia"
    const searchRes = await get('/api/posts?search=Patagonia');
    console.log(`Test 3 [Search "Patagonia"]: status=${searchRes.status}, count=${searchRes.body.count}, title="${searchRes.body.data[0].title}"`);
    if (searchRes.status !== 200 || searchRes.body.count !== 1) throw new Error('Test 3 failed');

    // Test 4: Like story 1
    const initialStory = await get('/api/posts/1');
    const initialLikes = initialStory.body.data.likes;
    const likeRes = await post('/api/posts/1/like', {});
    console.log(`Test 4 [POST /api/posts/1/like]: initialLikes=${initialLikes}, newLikes=${likeRes.body.likes}`);
    if (likeRes.status !== 200 || likeRes.body.likes !== initialLikes + 1) throw new Error('Test 4 failed');

    // Test 5: Add comment to story 1
    const commentRes = await post('/api/posts/1/comments', {
      author_name: 'Professor Smith',
      comment: 'Excellent project architecture with clear schema design and responsive UI!'
    });
    console.log(`Test 5 [POST /api/posts/1/comments]: status=${commentRes.status}, commentId=${commentRes.body.data.id}`);
    if (commentRes.status !== 201) throw new Error('Test 5 failed');

    // Test 6: Create new story
    const createRes = await post('/api/posts', {
      title: 'Majestic Fjords & Midnight Sun in Norway',
      country: 'Norway',
      continent: 'Europe',
      location: 'Geirangerfjord & Lofoten',
      category: 'Scenic Nature',
      travel_style: 'Adventure',
      budget_tier: '$$$',
      budget_estimate: '$170 - $260 / day',
      best_season: 'June - August',
      author_name: 'College Evaluator',
      author_role: 'External Examiner',
      summary: 'Sailing along dramatic glassy fjords and exploring Arctic fishing villages under the perpetual summer glow.',
      content: 'The Norwegian fjords cut deeply into vertical mountains crowned with cascading waterfalls...',
      highlights: ['Kayaking in the UNESCO Geirangerfjord', 'Hike to Reinebringen summit in Lofoten']
    });
    console.log(`Test 6 [POST /api/posts]: status=${createRes.status}, createdPostId=${createRes.body.data.id}, slug="${createRes.body.data.slug}"`);
    if (createRes.status !== 201) throw new Error('Test 6 failed');

    // Test 7: Verify new total count
    const updatedAll = await get('/api/posts');
    console.log(`Test 7 [Updated Count]: count=${updatedAll.body.count}`);
    if (updatedAll.body.count !== allPosts.body.count + 1) throw new Error('Test 7 failed');

    // Test 8: Check stats
    const stats = await get('/api/stats');
    console.log('Test 8 [Stats Summary]:', stats.body.data);

    console.log('\n=========================================');
    console.log('✅ ALL API TESTS PASSED SUCCESSFULLY! ✅');
    console.log('=========================================');
    process.exit(0);

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

runTests();
