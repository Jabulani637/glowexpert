const crypto = require('crypto');
const https = require('https');

// PayFast configuration
const PAYFAST_CONFIG = {
  merchantId: process.env.PAYFAST_MERCHANT_ID,
  merchantKey: process.env.PAYFAST_MERCHANT_KEY,
  passphrase: process.env.PAYFAST_PASSPHRASE || '',
  mode: process.env.PAYFAST_MODE || 'sandbox',
};

// PayFast host URLs
const PAYFAST_HOSTS = {
  sandbox: 'sandbox.payfast.co.za',
  live: 'www.payfast.co.za',
};

/**
 * Get the PayFast host based on the current mode
 */
function getPayFastHost() {
  return PAYFAST_HOSTS[PAYFAST_CONFIG.mode] || PAYFAST_HOSTS.sandbox;
}

/**
 * Generate MD5 signature for PayFast payment fields
 * Per PayFast docs: sort params alphabetically, URL-encode values, append passphrase if set
 */
function generateSignature(data) {
  // Get all parameter names and sort them alphabetically
  const paramNames = Object.keys(data).sort();
  
  // Build the signature string
  let signatureString = '';
  paramNames.forEach((paramName, index) => {
    const value = data[paramName];
    if (value !== null && value !== undefined && value !== '') {
      signatureString += `${paramName}=${encodeURIComponent(value).replace(/%20/g, '+')}`;
      if (index < paramNames.length - 1) {
        signatureString += '&';
      }
    }
  });
  
  // Append passphrase if set
  if (PAYFAST_CONFIG.passphrase) {
    signatureString += `&passphrase=${encodeURIComponent(PAYFAST_CONFIG.passphrase).replace(/%20/g, '+')}`;
  }
  
  // Generate MD5 hash
  return crypto.createHash('md5').update(signatureString).digest('hex');
}

/**
 * Build payment fields for PayFast checkout
 * @param {Object} order - Order object with id, total_amount, customer details
 * @param {Object} options - Additional options (return_url, cancel_url, notify_url)
 * @returns {Object} Payment fields including signature
 */
function buildPaymentFields(order, options = {}) {
  const { id, total_amount, customer_email, customer_name } = order;
  
  // Generate a unique m_payment_id (reference)
  const mPaymentId = `ORD-${id}-${Date.now()}`;
  
  // Build the payment fields
  const fields = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    amount: total_amount.toFixed(2),
    item_name: `Order ${id}`,
    m_payment_id: mPaymentId,
    description: `Order for ${customer_name || customer_email}`,
    email_address: customer_email,
    return_url: options.return_url || `${process.env.FRONTEND_URL}/payment/success`,
    cancel_url: options.cancel_url || `${process.env.FRONTEND_URL}/payment/cancel`,
    notify_url: options.notify_url || `${process.env.FRONTEND_URL}/api/payments/payfast/notify`,
  };
  
  // Generate signature
  fields.signature = generateSignature(fields);
  
  return {
    fields,
    mPaymentId,
    host: getPayFastHost(),
  };
}

/**
 * Verify ITN signature from PayFast
 * @param {Object} payload - The ITN payload from PayFast
 * @returns {boolean} True if signature is valid
 */
function verifyItnSignature(payload) {
  // Extract the signature from the payload
  const receivedSignature = payload.signature;
  
  // Remove signature from payload before recomputing
  const { signature, ...dataForSignature } = payload;
  
  // Recompute signature
  const computedSignature = generateSignature(dataForSignature);
  
  // Compare signatures (case-insensitive)
  return computedSignature.toLowerCase() === receivedSignature.toLowerCase();
}

/**
 * Verify source IP of the ITN request
 * PayFast IPs: https://www.payfast.co.za/eng/developer/integration-guide#itn
 * @param {string} ip - The IP address of the request
 * @returns {boolean} True if IP is from PayFast
 */
function verifySourceIp(ip) {
  // PayFast IP ranges (as per their documentation)
  const payfastIps = [
    '41.74.179.228',
    '41.74.179.229',
    '41.74.179.230',
    '41.74.179.231',
    '41.74.179.232',
    '41.74.179.233',
    '41.74.179.234',
    '41.74.179.235',
    '41.74.179.236',
    '41.74.179.237',
    '41.74.179.238',
    '41.74.179.239',
    '41.74.179.240',
    '41.74.179.241',
    '41.74.179.242',
    '41.74.179.243',
    '41.74.179.244',
    '41.74.179.245',
    '41.74.179.246',
    '41.74.179.247',
    '41.74.179.248',
    '41.74.179.249',
    '41.74.179.250',
    '41.74.179.251',
    '41.74.179.252',
    '41.74.179.253',
    '41.74.179.254',
    '41.74.179.255',
    '41.74.180.0',
    '41.74.180.1',
    '41.74.180.2',
    '41.74.180.3',
    '41.74.180.4',
    '41.74.180.5',
    '41.74.180.6',
    '41.74.180.7',
    '41.74.180.8',
    '41.74.180.9',
    '41.74.180.10',
    '41.74.180.11',
    '41.74.180.12',
    '41.74.180.13',
    '41.74.180.14',
    '41.74.180.15',
    '41.74.180.16',
    '41.74.180.17',
    '41.74.180.18',
    '41.74.180.19',
    '41.74.180.20',
    '41.74.180.21',
    '41.74.180.22',
    '41.74.180.23',
    '41.74.180.24',
    '41.74.180.25',
    '41.74.180.26',
    '41.74.180.27',
    '41.74.180.28',
    '41.74.180.29',
    '41.74.180.30',
    '41.74.180.31',
    '41.74.180.32',
    '41.74.180.33',
    '41.74.180.34',
    '41.74.180.35',
    '41.74.180.36',
    '41.74.180.37',
    '41.74.180.38',
    '41.74.180.39',
    '41.74.180.40',
    '41.74.180.41',
    '41.74.180.42',
    '41.74.180.43',
    '41.74.180.44',
    '41.74.180.45',
    '41.74.180.46',
    '41.74.180.47',
    '41.74.180.48',
    '41.74.180.49',
    '41.74.180.50',
    '41.74.180.51',
    '41.74.180.52',
    '41.74.180.53',
    '41.74.180.54',
    '41.74.180.55',
    '41.74.180.56',
    '41.74.180.57',
    '41.74.180.58',
    '41.74.180.59',
    '41.74.180.60',
    '41.74.180.61',
    '41.74.180.62',
    '41.74.180.63',
    '41.74.180.64',
    '41.74.180.65',
    '41.74.180.66',
    '41.74.180.67',
    '41.74.180.68',
    '41.74.180.69',
    '41.74.180.70',
    '41.74.180.71',
    '41.74.180.72',
    '41.74.180.73',
    '41.74.180.74',
    '41.74.180.75',
    '41.74.180.76',
    '41.74.180.77',
    '41.74.180.78',
    '41.74.180.79',
    '41.74.180.80',
    '41.74.180.81',
    '41.74.180.82',
    '41.74.180.83',
    '41.74.180.84',
    '41.74.180.85',
    '41.74.180.86',
    '41.74.180.87',
    '41.74.180.88',
    '41.74.180.89',
    '41.74.180.90',
    '41.74.180.91',
    '41.74.180.92',
    '41.74.180.93',
    '41.74.180.94',
    '41.74.180.95',
    '41.74.180.96',
    '41.74.180.97',
    '41.74.180.98',
    '41.74.180.99',
    '41.74.180.100',
    '41.74.180.101',
    '41.74.180.102',
    '41.74.180.103',
    '41.74.180.104',
    '41.74.180.105',
    '41.74.180.106',
    '41.74.180.107',
    '41.74.180.108',
    '41.74.180.109',
    '41.74.180.110',
    '41.74.180.111',
    '41.74.180.112',
    '41.74.180.113',
    '41.74.180.114',
    '41.74.180.115',
    '41.74.180.116',
    '41.74.180.117',
    '41.74.180.118',
    '41.74.180.119',
    '41.74.180.120',
    '41.74.180.121',
    '41.74.180.122',
    '41.74.180.123',
    '41.74.180.124',
    '41.74.180.125',
    '41.74.180.126',
    '41.74.180.127',
    '41.74.180.128',
    '41.74.180.129',
    '41.74.180.130',
    '41.74.180.131',
    '41.74.180.132',
    '41.74.180.133',
    '41.74.180.134',
    '41.74.180.135',
    '41.74.180.136',
    '41.74.180.137',
    '41.74.180.138',
    '41.74.180.139',
    '41.74.180.140',
    '41.74.180.141',
    '41.74.180.142',
    '41.74.180.143',
    '41.74.180.144',
    '41.74.180.145',
    '41.74.180.146',
    '41.74.180.147',
    '41.74.180.148',
    '41.74.180.149',
    '41.74.180.150',
    '41.74.180.151',
    '41.74.180.152',
    '41.74.180.153',
    '41.74.180.154',
    '41.74.180.155',
    '41.74.180.156',
    '41.74.180.157',
    '41.74.180.158',
    '41.74.180.159',
    '41.74.180.160',
    '41.74.180.161',
    '41.74.180.162',
    '41.74.180.163',
    '41.74.180.164',
    '41.74.180.165',
    '41.74.180.166',
    '41.74.180.167',
    '41.74.180.168',
    '41.74.180.169',
    '41.74.180.170',
    '41.74.180.171',
    '41.74.180.172',
    '41.74.180.173',
    '41.74.180.174',
    '41.74.180.175',
    '41.74.180.176',
    '41.74.180.177',
    '41.74.180.178',
    '41.74.180.179',
    '41.74.180.180',
    '41.74.180.181',
    '41.74.180.182',
    '41.74.180.183',
    '41.74.180.184',
    '41.74.180.185',
    '41.74.180.186',
    '41.74.180.187',
    '41.74.180.188',
    '41.74.180.189',
    '41.74.180.190',
    '41.74.180.191',
    '41.74.180.192',
    '41.74.180.193',
    '41.74.180.194',
    '41.74.180.195',
    '41.74.180.196',
    '41.74.180.197',
    '41.74.180.198',
    '41.74.180.199',
    '41.74.180.200',
    '41.74.180.201',
    '41.74.180.202',
    '41.74.180.203',
    '41.74.180.204',
    '41.74.180.205',
    '41.74.180.206',
    '41.74.180.207',
    '41.74.180.208',
    '41.74.180.209',
    '41.74.180.210',
    '41.74.180.211',
    '41.74.180.212',
    '41.74.180.213',
    '41.74.180.214',
    '41.74.180.215',
    '41.74.180.216',
    '41.74.180.217',
    '41.74.180.218',
    '41.74.180.219',
    '41.74.180.220',
    '41.74.180.221',
    '41.74.180.222',
    '41.74.180.223',
    '41.74.180.224',
    '41.74.180.225',
    '41.74.180.226',
    '41.74.180.227',
    '41.74.180.228',
    '41.74.180.229',
    '41.74.180.230',
    '41.74.180.231',
    '41.74.180.232',
    '41.74.180.233',
    '41.74.180.234',
    '41.74.180.235',
    '41.74.180.236',
    '41.74.180.237',
    '41.74.180.238',
    '41.74.180.239',
    '41.74.180.240',
    '41.74.180.241',
    '41.74.180.242',
    '41.74.180.243',
    '41.74.180.244',
    '41.74.180.245',
    '41.74.180.246',
    '41.74.180.247',
    '41.74.180.248',
    '41.74.180.249',
    '41.74.180.250',
    '41.74.180.251',
    '41.74.180.252',
    '41.74.180.253',
    '41.74.180.254',
    '41.74.180.255',
    '160.119.252.0',
    '160.119.252.1',
    '160.119.252.2',
    '160.119.252.3',
    '160.119.252.4',
    '160.119.252.5',
    '160.119.252.6',
    '160.119.252.7',
    '160.119.252.8',
    '160.119.252.9',
    '160.119.252.10',
    '160.119.252.11',
    '160.119.252.12',
    '160.119.252.13',
    '160.119.252.14',
    '160.119.252.15',
    '160.119.252.16',
    '160.119.252.17',
    '160.119.252.18',
    '160.119.252.19',
    '160.119.252.20',
    '160.119.252.21',
    '160.119.252.22',
    '160.119.252.23',
    '160.119.252.24',
    '160.119.252.25',
    '160.119.252.26',
    '160.119.252.27',
    '160.119.252.28',
    '160.119.252.29',
    '160.119.252.30',
    '160.119.252.31',
    '160.119.252.32',
    '160.119.252.33',
    '160.119.252.34',
    '160.119.252.35',
    '160.119.252.36',
    '160.119.252.37',
    '160.119.252.38',
    '160.119.252.39',
    '160.119.252.40',
    '160.119.252.41',
    '160.119.252.42',
    '160.119.252.43',
    '160.119.252.44',
    '160.119.252.45',
    '160.119.252.46',
    '160.119.252.47',
    '160.119.252.48',
    '160.119.252.49',
    '160.119.252.50',
    '160.119.252.51',
    '160.119.252.52',
    '160.119.252.53',
    '160.119.252.54',
    '160.119.252.55',
    '160.119.252.56',
    '160.119.252.57',
    '160.119.252.58',
    '160.119.252.59',
    '160.119.252.60',
    '160.119.252.61',
    '160.119.252.62',
    '160.119.252.63',
    '160.119.252.64',
    '160.119.252.65',
    '160.119.252.66',
    '160.119.252.67',
    '160.119.252.68',
    '160.119.252.69',
    '160.119.252.70',
    '160.119.252.71',
    '160.119.252.72',
    '160.119.252.73',
    '160.119.252.74',
    '160.119.252.75',
    '160.119.252.76',
    '160.119.252.77',
    '160.119.252.78',
    '160.119.252.79',
    '160.119.252.80',
    '160.119.252.81',
    '160.119.252.82',
    '160.119.252.83',
    '160.119.252.84',
    '160.119.252.85',
    '160.119.252.86',
    '160.119.252.87',
    '160.119.252.88',
    '160.119.252.89',
    '160.119.252.90',
    '160.119.252.91',
    '160.119.252.92',
    '160.119.252.93',
    '160.119.252.94',
    '160.119.252.95',
    '160.119.252.96',
    '160.119.252.97',
    '160.119.252.98',
    '160.119.252.99',
    '160.119.252.100',
    '160.119.252.101',
    '160.119.252.102',
    '160.119.252.103',
    '160.119.252.104',
    '160.119.252.105',
    '160.119.252.106',
    '160.119.252.107',
    '160.119.252.108',
    '160.119.252.109',
    '160.119.252.110',
    '160.119.252.111',
    '160.119.252.112',
    '160.119.252.113',
    '160.119.252.114',
    '160.119.252.115',
    '160.119.252.116',
    '160.119.252.117',
    '160.119.252.118',
    '160.119.252.119',
    '160.119.252.120',
    '160.119.252.121',
    '160.119.252.122',
    '160.119.252.123',
    '160.119.252.124',
    '160.119.252.125',
    '160.119.252.126',
    '160.119.252.127',
    '160.119.252.128',
    '160.119.252.129',
    '160.119.252.130',
    '160.119.252.131',
    '160.119.252.132',
    '160.119.252.133',
    '160.119.252.134',
    '160.119.252.135',
    '160.119.252.136',
    '160.119.252.137',
    '160.119.252.138',
    '160.119.252.139',
    '160.119.252.140',
    '160.119.252.141',
    '160.119.252.142',
    '160.119.252.143',
    '160.119.252.144',
    '160.119.252.145',
    '160.119.252.146',
    '160.119.252.147',
    '160.119.252.148',
    '160.119.252.149',
    '160.119.252.150',
    '160.119.252.151',
    '160.119.252.152',
    '160.119.252.153',
    '160.119.252.154',
    '160.119.252.155',
    '160.119.252.156',
    '160.119.252.157',
    '160.119.252.158',
    '160.119.252.159',
    '160.119.252.160',
    '160.119.252.161',
    '160.119.252.162',
    '160.119.252.163',
    '160.119.252.164',
    '160.119.252.165',
    '160.119.252.166',
    '160.119.252.167',
    '160.119.252.168',
    '160.119.252.169',
    '160.119.252.170',
    '160.119.252.171',
    '160.119.252.172',
    '160.119.252.173',
    '160.119.252.174',
    '160.119.252.175',
    '160.119.252.176',
    '160.119.252.177',
    '160.119.252.178',
    '160.119.252.179',
    '160.119.252.180',
    '160.119.252.181',
    '160.119.252.182',
    '160.119.252.183',
    '160.119.252.184',
    '160.119.252.185',
    '160.119.252.186',
    '160.119.252.187',
    '160.119.252.188',
    '160.119.252.189',
    '160.119.252.190',
    '160.119.252.191',
    '160.119.252.192',
    '160.119.252.193',
    '160.119.252.194',
    '160.119.252.195',
    '160.119.252.196',
    '160.119.252.197',
    '160.119.252.198',
    '160.119.252.199',
    '160.119.252.200',
    '160.119.252.201',
    '160.119.252.202',
    '160.119.252.203',
    '160.119.252.204',
    '160.119.252.205',
    '160.119.252.206',
    '160.119.252.207',
    '160.119.252.208',
    '160.119.252.209',
    '160.119.252.210',
    '160.119.252.211',
    '160.119.252.212',
    '160.119.252.213',
    '160.119.252.214',
    '160.119.252.215',
    '160.119.252.216',
    '160.119.252.217',
    '160.119.252.218',
    '160.119.252.219',
    '160.119.252.220',
    '160.119.252.221',
    '160.119.252.222',
    '160.119.252.223',
    '160.119.252.224',
    '160.119.252.225',
    '160.119.252.226',
    '160.119.252.227',
    '160.119.252.228',
    '160.119.252.229',
    '160.119.252.230',
    '160.119.252.231',
    '160.119.252.232',
    '160.119.252.233',
    '160.119.252.234',
    '160.119.252.235',
    '160.119.252.236',
    '160.119.252.237',
    '160.119.252.238',
    '160.119.252.239',
    '160.119.252.240',
    '160.119.252.241',
    '160.119.252.242',
    '160.119.252.243',
    '160.119.252.244',
    '160.119.252.245',
    '160.119.252.246',
    '160.119.252.247',
    '160.119.252.248',
    '160.119.252.249',
    '160.119.252.250',
    '160.119.252.251',
    '160.119.252.252',
    '160.119.252.253',
    '160.119.252.254',
    '160.119.252.255',
  ];
  
  return payfastIps.includes(ip);
}

/**
 * Make server-to-server confirmation call to PayFast
 * @param {Object} payload - The ITN payload from PayFast
 * @returns {Promise<Object>} Validation result
 */
function confirmWithPayFast(payload) {
  return new Promise((resolve, reject) => {
    const host = getPayFastHost();
    const path = '/eng/query/validate';
    
    // Build query string from payload
    const queryParams = new URLSearchParams(payload).toString();
    
    const options = {
      host,
      path: `${path}?${queryParams}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(queryParams),
      },
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 && data === 'VALID') {
          resolve({ valid: true });
        } else {
          resolve({ valid: false, reason: `PayFast validation failed: ${data}` });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(queryParams);
    req.end();
  });
}

/**
 * Perform all four PayFast ITN verification steps
 * @param {Object} payload - The ITN payload from PayFast
 * @param {string} ip - The IP address of the request
 * @param {Object} order - The order record from database
 * @returns {Promise<Object>} Verification result with details
 */
async function verifyItn(payload, ip, order) {
  const errors = [];
  
  // Step 1: Signature verification
  if (!verifyItnSignature(payload)) {
    errors.push('Signature verification failed');
  }
  
  // Step 2: Source IP verification (skip in sandbox mode as IPs may differ)
  if (PAYFAST_CONFIG.mode === 'live' && !verifySourceIp(ip)) {
    errors.push('Source IP verification failed');
  }
  
  // Step 3: Server-to-server confirmation
  try {
    const confirmation = await confirmWithPayFast(payload);
    if (!confirmation.valid) {
      errors.push(confirmation.reason || 'Server-to-server confirmation failed');
    }
  } catch (error) {
    errors.push(`Server-to-server confirmation error: ${error.message}`);
  }
  
  // Step 4: Amount verification
  const payfastAmount = parseFloat(payload.amount_gross);
  const orderAmount = parseFloat(order.total_amount);
  
  if (Math.abs(payfastAmount - orderAmount) > 0.01) {
    errors.push(`Amount mismatch: PayFast ${payfastAmount} vs Order ${orderAmount}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  buildPaymentFields,
  verifyItnSignature,
  verifySourceIp,
  confirmWithPayFast,
  verifyItn,
  getPayFastHost,
};
