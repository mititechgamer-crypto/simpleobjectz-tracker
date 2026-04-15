const DELHIVERY_TOKEN = 'c12825762e10702045da8f26e6dd7a929a40f701';
const DELHIVERY_API   = 'https://track.delhivery.com';
const ALLOWED_ORIGINS = [
  'https://www.simpleobjectz.com',
  'https://simpleobjectz.com',
  'http://localhost',
  'http://127.0.0.1',
  'null',
];

exports.handler = async (event) => {
  const origin = event.headers?.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };

  const params   = event.queryStringParameters || {};
  const awb      = (params.awb      || '').trim();
  const order_id = (params.order_id || '').trim();

  if (!awb && !order_id) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Provide awb or order_id.' }) };
  if (awb      && !/^\d{8,25}$/.test(awb))   return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid AWB format.' }) };
  if (order_id && !/^\d{7}$/.test(order_id)) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid Order ID. Must be 7 digits.' }) };

  const param = awb ? `waybill=${encodeURIComponent(awb)}` : `ref_ids=${encodeURIComponent(order_id)}`;
  const url   = `${DELHIVERY_API}/api/v1/packages/json/?${param}&token=${DELHIVERY_TOKEN}`;

  try {
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Delhivery ${response.status}`);
    const data = await response.json();
    if (!data?.ShipmentData?.length) return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ found: false }) };
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to connect to tracking service.' }) };
  }
};
