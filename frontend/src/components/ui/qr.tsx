import { APP_BASE_URL } from '../../lib/constants';
import { QRCodeSVG } from 'qrcode.react';

export const QRCodeGenerator: React.FC<{ className?: string; url: string; }> = ({ className, url }) => {
  return (
    <div className={className} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
      <div style={{ marginTop: '15px' }}>
        {url ? (
          <QRCodeSVG value={APP_BASE_URL+url} size={200} level="H" includeMargin />
        ) : (
          <p>Please enter a valid link.</p>
        )}
      </div>
    </div>
  );
};

export default QRCodeGenerator;