import QRCode from 'react-qr-code';

interface PetTagProps {
  petName: string;
  publicUrl: string;
  color?: string;
  bgColor?: string;
  textColor?: string;
  showBorder?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCutLines?: boolean; // Nuevo
  emergencyPhone?: string; // Nuevo
}

export function PetTag({ 
  petName, 
  publicUrl, 
  color = '#10b981', 
  bgColor = '#ffffff',
  textColor = '#1f2937', 
  showBorder = true,
  size = 'md',
  showCutLines = false,
  emergencyPhone
}: PetTagProps) {

  const dimensions = {
    sm: { container: '30mm', qr: 52, title: 'text-[11px]', brand: 'text-[6px]', holeTop: 'top-0.5', spacing: 'mt-1' }, 
    md: { container: '40mm', qr: 65, title: 'text-sm', brand: 'text-[8px]', holeTop: 'top-1', spacing: 'mt-1.5' },
    lg: { container: '50mm', qr: 85, title: 'text-lg', brand: 'text-[10px]', holeTop: 'top-1.5', spacing: 'mt-2' }
  };

  const currentSize = dimensions[size];

  return (
    // Quitamos los print:fixed de acá. Agregamos un borde punteado si showCutLines es true.
    <div className={`flex justify-center shrink-0 ${showCutLines ? 'print:border print:border-dashed print:border-gray-400 print:p-1' : ''}`}>
      
      <div 
        className="relative rounded-full flex flex-col items-center justify-center shadow-lg print:shadow-none shrink-0 mx-auto transition-colors duration-300"
        style={{ 
          width: currentSize.container, 
          height: currentSize.container,
          backgroundColor: bgColor,
          border: showBorder ? `4px solid ${color}` : 'none'
        }}
      >
        <div 
          className={`absolute ${currentSize.holeTop} w-2.5 h-2.5 rounded-full z-20 transition-colors duration-300`}
          style={{ border: `2px solid ${color}`, backgroundColor: bgColor }}
        ></div>
        
        <div className={`z-10 flex flex-col items-center ${currentSize.spacing}`}>
          <h3 
            className={`font-extrabold mb-0.5 tracking-tight truncate max-w-[85%] text-center transition-colors duration-300 ${currentSize.title}`}
            style={{ color: textColor }}
          >
            {petName}
          </h3>
          
          <div 
            className="flex items-center justify-center p-0.5 rounded-sm transition-colors duration-300"
            style={{ backgroundColor: bgColor }}
          >
            <QRCode 
              value={publicUrl}
              size={currentSize.qr}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              level="H"
              fgColor={textColor} 
              bgColor={bgColor}   
            />
          </div>

          <span 
            className={`font-bold uppercase mt-0.5 tracking-widest ${currentSize.brand}`}
            style={{ color: color }}
          >
            Pet Health
          </span>
          
          {/* Teléfono opcional ultra pequeño */}
          {emergencyPhone && (
            <span className="text-[5px] font-mono mt-0.5 print:text-[6px]" style={{ color: textColor }}>
              {emergencyPhone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}