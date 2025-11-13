
const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen  ">
      <h1 className="text-4xl font-extrabold text-orange-700 animate-pulse mb-4">
        🍱 MessMate
      </h1>

      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <p className="mt-5 text-lg text-gray-700 font-medium">
        Loading... please wait 🍛
      </p>
    </div>
  )
}

export default Loading