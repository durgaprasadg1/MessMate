import SmallDivs from "../Others/SmallDivs";
const SectionStats = ({totalUsers, totalMesses, pendingCount}) => {
 

  return (
          <section className=" grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <SmallDivs desc="Total Users" count={totalUsers} link='/admin/all-users'/>
            <SmallDivs desc="Total Messes" count={totalMesses} link='/admin/all-messes'/>
            <SmallDivs desc="Pending Verifications" count={pendingCount} link='/admin/pending-verification'/>
          </section>
    )
}
export default SectionStats;