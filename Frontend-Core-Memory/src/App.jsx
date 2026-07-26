import { useState, useEffect } from "react";
import OverlayMenu from "./components/OverlayMenu.jsx";
import EventListView from "./components/EventListView.jsx";
import EventTimelineView from "./components/EventTimelineView.jsx";
import ViewSwitcher from "./components/ViewSwitcher.jsx";

import axios from "axios";
import Header from "./components/Header.jsx";

function App() {
  const [memoryEntries, setMemoryEntries] = useState([]);
  const [entryTypes, setEntryTypes] = useState([]);
  const [timelineSelectedType, setTimelineSelectedType] = useState("");
  const [editingEntry, setEditingEntry] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const buttons = ["Timeline View", "Hierarchy View"];

  useEffect(() => {
    axios
      .get("https://127.0.0.1:8000/memory")
      .then((response) => {
        setMemoryEntries(response.data);
      })
      .catch((error) => {
        console.error("Error fetching memory entries:", error);
      });
  }, []);

  useEffect(() => {
    axios
      .get("https://127.0.0.1:8000/type/api")
      .then((response) => {
        setEntryTypes(response.data);
      })
      .catch((error) => {
        console.error("Error fetching entry types:", error);
      });
  }, []);

  const handleAddClick = (date, typeFromTimeline = "") => {
    if (date) {
      const newEntry = {
        date_start: date,
        MemoryType: typeFromTimeline ? { type: typeFromTimeline } : undefined,
      };
      setEditingEntry(newEntry);
    }
    setIsOpen(true);
  };

  const handleEditClick = (entry) => {
    setEditingEntry(entry);
    setIsOpen(true);
  };

  const handleOverlaySubmit = (newOrUpdatedEntry) => {
    if (memoryEntries.find((ev) => ev.id == newOrUpdatedEntry.id)) {
      setMemoryEntries((prev) =>
        prev.map((e) => (e.id === editingEntry.id ? newOrUpdatedEntry : e)),
      );
    } else {
      setMemoryEntries((prev) => [...prev, newOrUpdatedEntry]);
    }
  };

  const handleDeletion = (memoryIdForDeletion) => {
    axios
      .delete(`https://127.0.0.1:8000/memory/${memoryIdForDeletion}`)
      .then(() => {
        setMemoryEntries((prevEntries) =>
          prevEntries.filter(
            (entry) => entry.id !== Number(memoryIdForDeletion),
          ),
        );
        handleClosingOverlayMenu();
      })
      .catch((error) => {
        console.error("Error during Deletion of Memory:", error);
      });
  };

  const handleClosingOverlayMenu = () => {
    setIsOpen(false);
    setEditingEntry(null);
  };

  const addInitialType =
    active === 0 && !editingEntry?.title ? timelineSelectedType : "";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ======= TOP NAVBAR ======= */}
      <Header handleAddClick={handleAddClick} />

      {/* ======= MAIN CONTENT AREA ======= */}
      <main className="flex-1 pt-28 pb-0">
        <div className="max-w-[1700px] mx-auto px-6">
          {/* ======= VIEW SWITCHER ======= */}
          <ViewSwitcher
            active={active}
            setActive={setActive}
            buttons={buttons}
          />

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
                onSelectedTypeChange={setTimelineSelectedType}
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
          initialType={addInitialType}
          onClose={handleClosingOverlayMenu}
          onSubmit={handleOverlaySubmit}
          onDelete={handleDeletion}
        />
      )}
    </div>
  );
}

export default App;
