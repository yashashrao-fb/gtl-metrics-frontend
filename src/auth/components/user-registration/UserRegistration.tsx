import { ReactNode } from 'react';

export default function UserRegistrationComponent({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex h-screen">
        <div
          className="w-full max-w-[616px] bg-background text-on-surface-100 z-10"
          style={{ boxShadow: '4px 4px 42.4px -12px #ffffff26 !important' }}
        >
          {children}
        </div>

        <div
          className="flex-grow relative bg-no-repeat bg-cover bg-right h-full"
          style={{
            backgroundImage: 'url("assets/registration_frame.svg")',
          }}
        ></div>
      </div>
    </div>
  );
}
