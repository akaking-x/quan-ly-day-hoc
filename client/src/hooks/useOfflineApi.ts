import {
  offlineStudentApi,
  offlineGroupApi,
  offlineSessionApi,
  offlinePaymentApi,
  offlineReportApi,
} from '../services/offlineApi';

// Export all offline APIs for easy access
export const useOfflineApi = () => {
  return {
    studentApi: offlineStudentApi,
    groupApi: offlineGroupApi,
    sessionApi: offlineSessionApi,
    paymentApi: offlinePaymentApi,
    reportApi: offlineReportApi,
  };
};

// Also export individual APIs for direct import
export {
  offlineStudentApi,
  offlineGroupApi,
  offlineSessionApi,
  offlinePaymentApi,
  offlineReportApi,
};
