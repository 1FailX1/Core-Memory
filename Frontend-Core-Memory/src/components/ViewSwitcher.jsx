function ViewSwitcher({ active, setActive, buttons }) {
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-white shadow rounded-lg p-2 flex gap-2">
        {buttons.map((label, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-4 py-2 rounded transition-all duration-150
                  ${
                    active === i
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ViewSwitcher;
