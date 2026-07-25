import { useState, useEffect } from "react";
import OverlayMenu from "./components/OverlayMenu.jsx";
import EventListView from "./components/EventListView.jsx";
import EventTimelineView from "./components/EventTimelineView.jsx";

import axios from 'axios';

function App() {

  const [memoryEntries, setMemoryEntries] = useState([]);
  const [entryTypes, setEntryTypes] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const buttons = ["Timeline View", "Hierarchy View"];

  useEffect(() => {
    axios.get('https://127.0.0.1:8000/memory')
      .then(response => {
        setMemoryEntries(response.data);
      })
      .catch(error => {
        console.error('Error fetching entry types:', error);
      })
  }, []);

  useEffect(() => {
    axios.get('https://127.0.0.1:8000/type/api')
      .then(response => {
        setEntryTypes(response.data);
      })
      .catch(error => {
        console.error('Error fetching entry types:', error);
      })
  }, []);

  const handleAddClick = (date) => {
    if (date) {
      console.log("handleAddClick called! + date: " + date)
      const newEntry = {
        date_start: date
      };
      setEditingEntry(newEntry);
    }
    //console.log(editingEntry);
    setIsOpen(true);
  }

  const handleEditClick = (entry) => {
    setEditingEntry(entry);
    //console.log("handleEditClick called!")
    setIsOpen(true);
  }

  const handleOverlaySubmit = (newOrUpdatedEntry) => {
    if (memoryEntries.find(ev => ev.id == newOrUpdatedEntry.id)) {
      setMemoryEntries((prev) =>
        prev.map((e) => (e.id === editingEntry.id ? newOrUpdatedEntry : e))
      );
    } else {
      setMemoryEntries((prev) => [...prev, newOrUpdatedEntry]);
    }
  }

  const handleDeletion = (memoryIdForDeletion) => {
    axios.delete(`https://127.0.0.1:8000/memory/${memoryIdForDeletion}`)
      .then(() => {
        setMemoryEntries(prevEntries =>
          prevEntries.filter(entry => entry.id !== Number(memoryIdForDeletion))
        );
        handleClosingOverlayMenu();
      })
      .catch(error => {
        console.error('Error during Deletion of Memory:', error);
      });
  };

  const handleClosingOverlayMenu = () => {
    setIsOpen(false);
    setEditingEntry(null);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ======= TOP NAVBAR ======= */}
      <header className="w-full bg-white shadow-sm fixed top-0 left-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">
            Core Memory Prototype
          </h1>

          <button
            onClick={() => handleAddClick()}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 flex flex-row gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>

            Add Entry
          </button>
        </div>
      </header>

      {/* ======= MAIN CONTENT AREA ======= */}
      <main className="flex-1 pt-28 pb-0">
        <div className="max-w-[1700px] mx-auto px-6">

          {/* ======= VIEW SWITCHER ======= */}
          <div className="flex justify-center mb-8">
            <div className="bg-white shadow rounded-lg p-2 flex gap-2">
              {buttons.map((label, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`px-4 py-2 rounded transition-all duration-150
                  ${active === i
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ======= CONTENT CARD ======= */}
          <div className="bg-white shadow-md rounded-lg p-6 pb-18 overflow-hidden">
            {active === 1 ? (
              <EventListView
                entries={memoryEntries}
                onEdit={handleEditClick}
                onDelete={handleDeletion}
              />
            ) : (
              <EventTimelineView
                entries={memoryEntries}
                onEdit={handleEditClick}
                onAdd={handleAddClick}
              />
            )}
          </div>
        </div>
      </main>

      {/* ======= OVERLAY MENU ======= */}
      {isOpen && (
        <OverlayMenu
          initialData={editingEntry}
          entryTypes={entryTypes}
          onClose={handleClosingOverlayMenu}
          onSubmit={handleOverlaySubmit}
          onDelete={handleDeletion}
        />
      )}
    </div>
  );

}

export default App;