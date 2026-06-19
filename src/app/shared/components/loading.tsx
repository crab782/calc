import { Spin } from 'antd';

export function Loading({ fullScreen = false }: { fullScreen?: boolean }) {
  return <Spin size="large" style={fullScreen ? { position: 'fixed', top: '50%', left: '50%' } : {}} />;
}
