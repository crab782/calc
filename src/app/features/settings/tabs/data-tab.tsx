import { useRef, useCallback } from 'react';
import { Button, Card, Space, Typography, Divider, Alert, Popconfirm, message } from 'antd';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../providers';
import { useRecords } from '../../../hooks';
import { recordService } from '../../../../data/service';

const { Text } = Typography;

export const DataTab = () => {
  const { t } = useLanguage();
  const { count, refresh } = useRecords();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const jsonData = recordService.exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'account-book.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(t.settings.exportSuccess);
  }, [t]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (count > 0) {
      const confirmText = t.settings.importConfirm.replace('{count}', String(count));
      if (!confirm(confirmText)) {
        e.target.value = '';
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const importResult = recordService.importData(result);
      if (importResult.success) {
        message.success(t.settings.importSuccess);
        refresh();
      } else {
        message.error(t.settings.importError);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }, [count, t, refresh]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClearData = useCallback(() => {
    recordService.deleteAllRecords();
    refresh();
    message.success(t.settings.clearSuccess);
  }, [refresh, t]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <Card title={t.settings.dataManagement} bordered={false}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--ant-color-fill-alter)', borderRadius: 8 }}>
            <Text type="secondary">{t.settings.currentRecords}</Text>
            <Text strong style={{ fontSize: 20 }}>{count}</Text>
          </div>

          <Space size={12} style={{ width: '100%' }}>
            <Button type="primary" icon={<Download className="w-4 h-4" />} onClick={handleExport} style={{ flex: 1 }}>
              {t.settings.exportData}
            </Button>
            <Button type="primary" icon={<Upload className="w-4 h-4" />} onClick={handleImportClick} style={{ flex: 1 }}>
              {t.settings.importData}
            </Button>
          </Space>

          <Divider style={{ margin: '8px 0' }} />

          <Popconfirm
            title={t.settings.clearConfirm}
            description={t.settings.clearMessage}
            onConfirm={handleClearData}
            okText={t.settings.confirmClear}
            cancelText={t.settings.cancel}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<Trash2 className="w-4 h-4" />} size="small">
              {t.settings.clearData}
            </Button>
          </Popconfirm>
        </Space>
      </Card>

      <Alert
        type="info"
        title={t.settings.importExportInfo}
        description={
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            <li>{t.settings.info1}</li>
            <li>{t.settings.info2}</li>
            <li>{t.settings.info3}</li>
            <li>{t.settings.info4}</li>
          </ul>
        }
      />
    </Space>
  );
};
