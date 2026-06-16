import sidebar from './sidebar.json';
import dashboard from './dashboard.json';
import addRecord from './addRecord.json';
import accounts from './accounts.json';
import incomeRules from './incomeRules.json';
import settings from './settings.json';
import charts from './charts.json';
import history from './history.json';
import common from './common.json';

export default {
  sidebar,
  dashboard,
  addRecord,
  accounts,
  incomeRules,
  settings,
  ...charts,
  history,
  common,
};