function Header({ handleAddClick }) {
  return (
    <header className="w-full bg-white shadow-sm fixed top-0 left-0 z-20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">
          Core Memory Prototype
        </h1>

        <button
          onClick={() => handleAddClick()}
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 flex flex-row gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Entry
        </button>
      </div>
    </header>
  );
}

export default Header;
