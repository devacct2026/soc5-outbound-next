import Image from 'next/image';

type LoadType = 'single' | 'coload' | 'triload';

type PrintableTruckLabelProps = {
  plateNumber: string;
  driverId: string;
  dockNumber: string;
  dockTime?: string | null;
  startLoading?: string | null;
  loadType: LoadType;
};

const templates: Record<LoadType, string> = {
  single: '/label-templates/single_lh.jpg',
  coload: '/label-templates/coload_lh.jpg',
  triload: '/label-templates/triload_lh.jpg',
};

export default function PrintableTruckLabel({
  plateNumber,
  driverId,
  dockNumber,
  dockTime,
  startLoading,
  loadType,
}: PrintableTruckLabelProps) {
  return (
    <section className="printable-truck-label" aria-label="Truck label">
      <div className="truck-label-sheet">
        <Image
          src={templates[loadType]}
          alt={`${loadType} load truck label template`}
          fill
          sizes="(max-width: 1120px) 100vw, 1120px"
          style={{ objectFit: 'fill' }}
        />
        <span className="label-value label-plate">{plateNumber}</span>
        <span className="label-value label-driver">{driverId}</span>
        <span className="label-value label-dock">{dockNumber}</span>
        <span className="label-value label-dock-time">{dockTime ?? ''}</span>
        <span className="label-value label-start-loading">{startLoading ?? ''}</span>
      </div>
      <button
        className="truck-label-print-button"
        onClick={() => window.print()}
        type="button"
      >
        Print
      </button>
    </section>
  );
}