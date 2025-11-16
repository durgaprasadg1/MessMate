const SectionStats = ({totalUsers, totalMesses, pendingCount}) => {
return (<section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold mt-2">{totalUsers}</p>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Messes</p>
            <p className="text-2xl font-bold mt-2">{totalMesses}</p>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-500">Pending Verifications</p>
            <p className="text-2xl font-bold mt-2 text-yellow-600">
              {pendingCount}
            </p>
          </div>
        </section>)
}
export default SectionStats;