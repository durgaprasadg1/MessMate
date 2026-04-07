import Image from "next/image";

const AuthOrbitPanel = ({ title, subtitle }) => {
  return (
    <div className="relative h-[100px] sm:h-[360px] lg:h-full rounded-4xl border border-orange-200/80 bg-linear-to-br from-orange-100 via-amber-50 to-orange-200/70 p-2 sm:p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.28),transparent_56%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(234,88,12,0.2),transparent_52%)]" />

      <div className="relative z-10 flex h-full flex-col">
        <div>
          
          <h3 className="mt-1 text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
            {title}
          </h3>
          <p className="mt-2 text-sm text-stone-700/90 max-w-sm">{subtitle}</p>
        </div>

        <div className="mt-4 sm:mt-6 flex-1 flex items-center justify-center">
          <div className="auth-orbit-shell">
            <div className="auth-orbit-center relative">
              <Image
                src="/mh.png"
                alt="Main auth visual"
                fill
                sizes="(max-width: 4096px) 45vw, 22vw"
                className="object-cover"
              />
            </div>

            <div className="auth-orbit auth-orbit-cw">
              <div className="auth-orbit-node auth-orbit-node-a relative">
                <Image
                  src="/pb.png"
                  alt="Orbit visual one"
                  fill
                  sizes="(max-width: 4096px) 18vw, 8vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="auth-orbit auth-orbit-ccw">
              <div className="auth-orbit-node auth-orbit-node-b relative">
                <Image
                  src="/ni.png"
                  alt="Orbit visual two"
                  fill
                  sizes="(max-width: 4096px) 18vw, 8vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthOrbitPanel;
