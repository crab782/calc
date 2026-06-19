import { Button } from 'antd';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../../providers';

export function LangSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      size="small"
      onClick={toggleLanguage}
      icon={<Globe className="w-4 h-4" />}
    >
      {language === 'zh' ? 'EN' : '中文'}
    </Button>
  );
}
