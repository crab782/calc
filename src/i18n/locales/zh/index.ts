import sidebar from './sidebar.json';
import dashboard from './dashboard.json';
import addRecord from './addRecord.json';
import settings from './settings.json';
import charts from './charts.json';
import history from './history.json';
import common from './common.json';

export default {
  sidebar,
  dashboard,
  addRecord,
  settings,
  ...charts,
  history,
  common,
};