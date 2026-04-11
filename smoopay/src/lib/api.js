const BASE_URL_1 = '/api-proxy-1';
const BASE_URL_2 = '/api-proxy-2';
const TBANK_PROXY = '/s3-proxy'; // smuedu-dev.outsystemsenterprise.com is already proxied here

export const API_ENDPOINTS = {
  // Agreement Management
  GET_AGREEMENTS: `${BASE_URL_2}/Agreement/rest/Agreement/GetAgreements`,
  GET_ALL_INFO: `${BASE_URL_2}/ManageEscrow/rest/ManageEscrow/GetAgreementAllInfo`,
  UPDATE_AGREEMENT: `${BASE_URL_2}/Agreement/rest/Agreement/UpdateAgreement`,
  DELETE_AGREEMENT: `${BASE_URL_2}/Agreement/rest/Agreement/DeleteAgreement`,
  CREATE_AGREEMENT: `${BASE_URL_2}/Agreement/rest/Agreement/CreateAgreement`,
  ACTIVATE_AGREEMENT: `${BASE_URL_2}/ManageEscrow/rest/ManageEscrow/ActivateAgreement`,

  // Milestone Lifecycle
  CREATE_MILESTONE: `${BASE_URL_2}/Milestone/rest/Milestone/CreateMilestone`,
  UPDATE_MILESTONE: `${BASE_URL_2}/Milestone/rest/Milestone/UpdateMilestone`,
  DELETE_MILESTONE: `${BASE_URL_2}/Milestone/rest/Milestone/DeleteMilestone`,
  UPDATE_STATUS: `${BASE_URL_2}/ManageEscrow/rest/ManageEscrow/UpdateMilestoneStatus`,
  APPROVE_MILESTONE: `${BASE_URL_2}/ManageEscrow/rest/ManageEscrow/ApproveMilestone`,

  // Credit Transfer (New)
  GET_ACCOUNTS_BY_UEN: `${BASE_URL_1}/CreditTransfer/rest/CreditTransfer/GetAccountsByUENorCustId`,
  CHARGE_FEE: `${BASE_URL_1}/CreditTransfer/rest/CreditTransfer/ChargeFee`,

  // Amazon S3 File Fetch
  FETCH_FILE: '/s3-proxy/SMULab_AmazonS3/rest/AmazonS3/FetchFile',
  S3_API_KEY: '79a7f4cc-3ddc-4f8c-b1f3-557c7ff73af7',

  // tBank Cash Operations — CustomerID is substituted at call time
  DEPOSIT_CASH: (customerId) => `${TBANK_PROXY}/Gateway/rest/Account/${encodeURIComponent(customerId)}/DepositCash`,
  WITHDRAW_CASH: (customerId) => `${TBANK_PROXY}/Gateway/rest/Account/${encodeURIComponent(customerId)}/WithdrawCash`,
};

/**
 * Generates a unique 10-digit transactionId string as required by tBank API.
 */
export function generateTransactionId() {
  const ts = Date.now().toString(); // 13 digits
  return ts.slice(-10); // last 10 digits
}

/**
 * Common API Client for standardized requests
 */
export async function apiClient(url, options = {}) {
  const { method = 'GET', body, headers = {}, params = {} } = options;

  // Build URL with query parameters
  const urlObj = new URL(url, window.location.origin);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      urlObj.searchParams.append(key, params[key]);
    }
  });

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...options,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(body);
  }

  console.log(`[API Request] ${method} ${urlObj.pathname}${urlObj.search}`, body || '');

  try {
    const response = await fetch(urlObj.toString(), config);
    console.log(`[API Response] ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        errorData = { message: text };
      }
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  } catch (error) {
    console.error(`[API Client Error] ${method} ${url}:`, error);
    throw error;
  }
}
