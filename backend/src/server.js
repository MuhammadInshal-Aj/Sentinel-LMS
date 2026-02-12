const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  const grokKey = (process.env.GROK_API_KEY || '').trim();
  const aiConfigured = Boolean(groqKey || grokKey);
  const keySource = groqKey ? 'GROQ_API_KEY' : (grokKey ? 'GROK_API_KEY' : null);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`[AI] Groq configured: ${aiConfigured ? 'yes' : 'no'}${keySource ? ` (${keySource})` : ''}`);
});
