export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ 
    message: 'JavaScript function works!', 
    timestamp: new Date().toISOString() 
  });
}
