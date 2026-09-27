const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDatabase } = require('./db/database');

// Initialize database schema and initial data
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to safely parse JSON columns
function formatPost(post) {
  if (!post) return null;
  return {
    ...post,
    highlights: typeof post.highlights === 'string' ? JSON.parse(post.highlights || '[]') : post.highlights,
    itinerary: typeof post.itinerary === 'string' ? JSON.parse(post.itinerary || '[]') : post.itinerary,
    gallery: typeof post.gallery === 'string' ? JSON.parse(post.gallery || '[]') : post.gallery,
    featured: Boolean(post.featured)
  };
}

// ==========================================
// REST API ROUTES
// ==========================================

// 1. GET /api/posts - Search, Filter, Sort
app.get('/api/posts', (req, res) => {
  try {
    const { search, category, continent, travel_style, budget_tier, sort } = req.query;

    let query = 'SELECT * FROM posts WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (
        title LIKE ? OR 
        country LIKE ? OR 
        continent LIKE ? OR 
        location LIKE ? OR 
        summary LIKE ? OR 
        content LIKE ?
      )`;
      const wildcard = `%${search.trim()}%`;
      params.push(wildcard, wildcard, wildcard, wildcard, wildcard, wildcard);
    }

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (continent && continent !== 'All') {
      query += ' AND continent = ?';
      params.push(continent);
    }

    if (travel_style && travel_style !== 'All') {
      query += ' AND travel_style = ?';
      params.push(travel_style);
    }

    if (budget_tier && budget_tier !== 'All') {
      query += ' AND budget_tier = ?';
      params.push(budget_tier);
    }

    // Sorting
    switch (sort) {
      case 'popular':
        query += ' ORDER BY likes DESC, views DESC';
        break;
      case 'reading_time':
        query += ' ORDER BY reading_time ASC';
        break;
      case 'rating':
        query += ' ORDER BY rating DESC';
        break;
      case 'latest':
      default:
        query += ' ORDER BY created_at DESC, id DESC';
        break;
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    const posts = rows.map(formatPost);

    res.json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, message: 'Server error fetching posts', error: error.message });
  }
});

// 2. GET /api/posts/featured - Featured stories
app.get('/api/posts/featured', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM posts WHERE featured = 1 ORDER BY likes DESC LIMIT 3');
    const rows = stmt.all();
    res.json({
      success: true,
      data: rows.map(formatPost)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching featured posts' });
  }
});

// 3. GET /api/stats - High-level metrics for dashboard/hero
app.get('/api/stats', (req, res) => {
  try {
    const totalPosts = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
    const countriesCount = db.prepare('SELECT COUNT(DISTINCT country) as count FROM posts').get().count;
    const continentsCount = db.prepare('SELECT COUNT(DISTINCT continent) as count FROM posts').get().count;
    const totalLikes = db.prepare('SELECT SUM(likes) as sum FROM posts').get().sum || 0;
    const totalViews = db.prepare('SELECT SUM(views) as sum FROM posts').get().sum || 0;

    res.json({
      success: true,
      data: {
        totalPosts,
        countriesCount,
        continentsCount,
        totalLikes,
        totalViews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
});

// 4. GET /api/categories - Aggregate categories with count
app.get('/api/categories', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM posts 
      GROUP BY category 
      ORDER BY count DESC
    `);
    const rows = stmt.all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
});

// 5. GET /api/destinations - Countries & Continents overview
app.get('/api/destinations', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT country, continent, COUNT(*) as story_count, hero_image 
      FROM posts 
      GROUP BY country 
      ORDER BY story_count DESC
    `);
    const rows = stmt.all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching destinations' });
  }
});

// 6. GET /api/posts/:identifier - Get single post by ID or Slug
app.get('/api/posts/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    let post = null;

    if (/^\d+$/.test(identifier)) {
      post = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(identifier));
    } else {
      post = db.prepare('SELECT * FROM posts WHERE slug = ?').get(identifier);
    }

    if (!post) {
      return res.status(404).json({ success: false, message: 'Travel story not found' });
    }

    // Increment views
    db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(post.id);
    post.views += 1;

    // Fetch comments
    const commentsStmt = db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY id DESC');
    const comments = commentsStmt.all(post.id);

    res.json({
      success: true,
      data: {
        ...formatPost(post),
        comments
      }
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ success: false, message: 'Server error fetching story details' });
  }
});

// 7. POST /api/posts - Create new travel story
app.post('/api/posts', (req, res) => {
  try {
    const {
      title,
      summary,
      content,
      highlights,
      itinerary,
      category,
      country,
      continent,
      location,
      hero_image,
      gallery,
      author_name,
      author_avatar,
      author_role,
      budget_tier,
      budget_estimate,
      travel_style,
      best_season
    } = req.body;

    if (!title || !content || !country || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, content, country, and category are required.'
      });
    }

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    // Calculate reading time (~200 words per minute)
    const wordCount = (content || '').trim().split(/\s+/).length;
    const reading_time = Math.max(1, Math.ceil(wordCount / 200));

    // Fallback image defaults
    const finalHero = hero_image && hero_image.trim() !== ''
      ? hero_image
      : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';

    const finalAvatar = author_avatar && author_avatar.trim() !== ''
      ? author_avatar
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

    const highlightsStr = Array.isArray(highlights)
      ? JSON.stringify(highlights)
      : (typeof highlights === 'string' && highlights.startsWith('[') ? highlights : JSON.stringify([highlights || 'Incredible sights']));

    const itineraryStr = Array.isArray(itinerary)
      ? JSON.stringify(itinerary)
      : (typeof itinerary === 'string' && itinerary.startsWith('[') ? itinerary : JSON.stringify([]));

    const galleryStr = Array.isArray(gallery)
      ? JSON.stringify(gallery)
      : (typeof gallery === 'string' && gallery.startsWith('[') ? gallery : JSON.stringify([]));

    const created_at = new Date().toISOString().split('T')[0];

    const insertStmt = db.prepare(`
      INSERT INTO posts (
        title, slug, summary, content, highlights, itinerary,
        category, country, continent, location, hero_image, gallery,
        author_name, author_avatar, author_role, reading_time,
        budget_tier, budget_estimate, travel_style, best_season,
        rating, likes, views, featured, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    const result = insertStmt.run(
      title,
      slug,
      summary || title,
      content,
      highlightsStr,
      itineraryStr,
      category,
      country,
      continent || 'Global',
      location || country,
      finalHero,
      galleryStr,
      author_name || 'Travel Enthusiast',
      finalAvatar,
      author_role || 'Wanderer & Storyteller',
      reading_time,
      budget_tier || '$$',
      budget_estimate || '$70 - $120 / day',
      travel_style || 'Solo Backpacking',
      best_season || 'Year-round',
      4.8,
      1,
      1,
      0,
      created_at
    );

    const newPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Travel story published successfully!',
      data: formatPost(newPost)
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, message: 'Failed to create travel story', error: error.message });
  }
});

// 8. POST /api/posts/:id/like - Like a story
app.post('/api/posts/:id/like', (req, res) => {
  try {
    const { id } = req.params;
    const post = db.prepare('SELECT id, likes FROM posts WHERE id = ?').get(Number(id));

    if (!post) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const newLikes = (post.likes || 0) + 1;
    db.prepare('UPDATE posts SET likes = ? WHERE id = ?').run(newLikes, post.id);

    res.json({
      success: true,
      likes: newLikes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error liking post' });
  }
});

// 9. POST /api/posts/:id/comments - Add reader comment
app.post('/api/posts/:id/comments', (req, res) => {
  try {
    const { id } = req.params;
    const { author_name, comment } = req.body;

    if (!author_name || !comment) {
      return res.status(400).json({ success: false, message: 'Name and comment are required' });
    }

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(Number(id));
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author_name)}`;
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);

    const insertStmt = db.prepare(`
      INSERT INTO comments (post_id, author_name, author_avatar, comment, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(post.id, author_name.trim(), avatarUrl, comment.trim(), formattedDate);
    const newComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Error adding comment' });
  }
});

// 10. DELETE /api/posts/:id - Delete story (helpful for testing/admin)
app.delete('/api/posts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM posts WHERE id = ?').run(Number(id));
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }
    res.json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting story' });
  }
});

// Catch-all route to serve index.html for client-side navigation (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` WanderWave Travel Blog Server running successfully! `);
  console.log(` URL: http://localhost:${PORT}                       `);
  console.log(` Alt: http://127.0.0.1:${PORT}                       `);
  console.log(` Database: SQLite (wanderlust.sqlite)               `);
  console.log(`====================================================`);
});
