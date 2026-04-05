const BASE_URL = 'https://personal-p2jf2c9n.outsystemscloud.com';

export const API_ENDPOINTS = {
  // Agreement Management
  GET_AGREEMENTS: `${BASE_URL}/Agreement/rest/Agreement/GetAgreements`,
  GET_ALL_INFO: `${BASE_URL}/ManageEscrow/rest/ManageEscrow/GetAgreementAllInfo`,
  UPDATE_AGREEMENT: `${BASE_URL}/Agreement/rest/Agreement/UpdateAgreement`,
  DELETE_AGREEMENT: `${BASE_URL}/Agreement/rest/Agreement/DeleteAgreement`,
  CREATE_AGREEMENT: `${BASE_URL}/Agreement/rest/Agreement/CreateAgreement`,
  ACTIVATE_AGREEMENT: `${BASE_URL}/ManageEscrow/rest/ManageEscrow/ActivateAgreement`,

  // Milestone Lifecycle
  CREATE_MILESTONE: `${BASE_URL}/Milestone/rest/Milestone/CreateMilestone`,
  UPDATE_MILESTONE: `${BASE_URL}/Milestone/rest/Milestone/UpdateMilestone`,
  DELETE_MILESTONE: `${BASE_URL}/Milestone/rest/Milestone/DeleteMilestone`,
  UPDATE_STATUS: `${BASE_URL}/ManageEscrow/rest/ManageEscrow/UpdateMilestoneStatus`,
  APPROVE_MILESTONE: `${BASE_URL}/ManageEscrow/rest/ManageEscrow/ApproveMilestone`,

  // Amazon S3 File Fetch
  FETCH_FILE: 'https://smuedu-dev.outsystemsenterprise.com/SMULab_AmazonS3/rest/AmazonS3/FetchFile',
  S3_API_KEY: '79a7f4cc-3ddc-4f8c-b1f3-557c7ff73af7'
};
