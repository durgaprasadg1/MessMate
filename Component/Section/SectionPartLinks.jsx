import AdminActionCard from "../Admin/AdminActionCard";
const SectionPart = () =>{
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <AdminActionCard
                href="/admin/pending-verification"
                title="Pending Verification"
                description="Review newly created messes and approve or reject listings."
              />
    
              <AdminActionCard
                href="/admin/analytics"
                title="Analytics"
                description="View metrics, signups, active users and trends."
              />
            </section>
}
export default SectionPart;