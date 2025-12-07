import OwnerNavbar from '@/Component/Owner/OwnerNavbar';
import MessMenuComponent from '@/Component/IndividualMess/FillMenuComponent';

export default async function UpdateMenuPage({ params }) {
  const { id } = await params;

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const res = await fetch(`${base}/api/mess/${id}`, { cache: 'no-store' });

  if (!res.ok) {
    return  (
      <>
       <OwnerNavbar />
     
      <div className="min-h-screen  flex items-center justify-center bg-gray-950">
        
        <div className="p-7 bg-gray-800 rounded text-white  text-center">
         
       ----- Mess not found ------
       </div>
      </div>
       </>
    );
  }

  const mess = await res.json();

  return (
    <div className='bg-gray-800'>
      <OwnerNavbar />
      <main className="min-h-screen py-10 px-4 mt-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Update Menu for {mess.name}
          </h2>
          <MessMenuComponent
            messId={id}
            mess={mess}
            category={mess.category}
          />
        </div>
      </main>
    </div>
  );
}
