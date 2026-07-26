import { useState, useMemo } from "react";

const options = { year: "numeric", month: "short", day: "numeric" };

function EventListView({ entries, onEdit, onDelete }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [sortOption, setSortOption] = useState("date-desc");

  // --- FILTER + SEARCH + SORT PIPELINE ---
  const processedEntries = useMemo(() => {
    let list = [...entries];

    // 1) SEARCH
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)),
      );
    }

    // 2) FILTER BY TYPE
    if (selectedFilter !== "All") {
      list = list.filter((e) => e.MemoryType.type === selectedFilter);
    }

    // 3) SORTING
    list.sort((a, b) => {
      switch (sortOption) {
        case "date-asc":
          return new Date(a.date_start) - new Date(b.date_start);
        case "date-desc":
          return new Date(b.date_start) - new Date(a.date_start);
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "type-asc":
          return a.MemoryType.type.localeCompare(b.MemoryType.type);
        case "type-desc":
          return b.MemoryType.type.localeCompare(a.MemoryType.type);
        default:
          return 0;
      }
    });

    return list;
  }, [entries, searchQuery, selectedFilter, sortOption]);

  return (
    <div className="mt-6 w-full max-w-7xl mx-auto px-4">
      {/* --- SEARCH + FILTER + SORT BAR --- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full lg:w-1/3 px-3 py-2 border rounded shadow-sm focus:ring focus:ring-blue-200 transition"
        />

        {/* FILTER BUTTONS */}
        <div className="flex flex-wrap gap-2">
          {[
            "All",
            "Major Event",
            "Minor Event",
            "Core Memory",
            "Minor Period",
            "Major Period",
          ].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFilter(type)}
              className={`
                px-3 py-1 rounded transition
                ${
                  selectedFilter === type
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-200 hover:bg-gray-300"
                }
              `}
            >
              {type}
            </button>
          ))}
        </div>

        {/* SORTING */}
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="px-3 py-2 border rounded shadow-sm focus:ring focus:ring-blue-200 transition"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="title-asc">Title A → Z</option>
          <option value="title-desc">Title Z → A</option>
          <option value="type-asc">Type A → Z</option>
          <option value="type-desc">Type Z → A</option>
        </select>
      </div>

      {/* --- GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedEntries.map((e, i) => (
          <div
            key={i}
            className="
              relative p-4 bg-white rounded-lg shadow-md
              transition-all duration-300 ease-out
              hover:shadow-xl hover:scale-[1.02]
              group
            "
            style={{
              paddingLeft: "7%",
              background: `linear-gradient(to right, ${e.color} 4%, white 4%)`,
            }}
          >
            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition">
              {e.title}
            </h2>

            {/* Image */}
            {e.image && (
              <div className="overflow-hidden rounded">
                <img
                  src={URL.createObjectURL(e.image)}
                  alt={e.title}
                  className="
                    w-full h-40 object-cover rounded
                    transition-transform duration-300
                    group-hover:scale-105
                  "
                />
              </div>
            )}

            {/* Description */}
            {e.description && (
              <p className="text-gray-700 leading-relaxed">{e.description}</p>
            )}

            {/* Type + Date */}
            <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
              <span className="px-2 py-1 bg-gray-100 rounded border text-gray-600">
                {e.MemoryType.type}
              </span>

              {e.MemoryType.type.includes("Period") ? (
                <span>
                  {new Date(e.date_start).toLocaleDateString(
                    undefined,
                    options,
                  )}{" "}
                  –{" "}
                  {new Date(e.date_end).toLocaleDateString(undefined, options)}
                </span>
              ) : (
                <span>
                  {new Date(e.date_start).toLocaleDateString(
                    undefined,
                    options,
                  )}
                </span>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-3">
              <button
                onClick={() => onEdit(e)}
                className="
                  px-3 py-1 bg-yellow-500 text-white rounded
                  transition-all duration-200
                  hover:bg-yellow-600 hover:shadow
                "
              >
                Edit
              </button>

              <button
                onClick={() => onDelete(e.id)}
                className="
                  px-3 py-1 bg-red-500 text-white rounded
                  transition-all duration-200
                  hover:bg-red-600 hover:shadow
                "
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventListView;
