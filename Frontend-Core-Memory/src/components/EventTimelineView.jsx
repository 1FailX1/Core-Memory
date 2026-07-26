import { useEffect, useLayoutEffect, useRef, useState } from "react";
import axios from "axios";

function EventTimelineView({ entries, onEdit, onAdd, onSelectedTypeChange }) {
  const barRef = useRef(null);
  const [barWidth, setBarWidth] = useState(0);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [cursorX, setCursorX] = useState(0);
  const [cursorY, setCursorY] = useState(0);
  const [isOverBar, setIsOverBar] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [initialWidth, setInitialWidth] = useState(1200);

  const startDate = new Date(2006, 0, 1);
  const endDate = new Date(2027, 0, 1);
  const totalMs = endDate - startDate;
  const baseDate = new Date(
    startDate.getTime() + (cursorX / (barWidth * zoom)) * totalMs,
  );
  const [scrollAdjustedDate, setScrollAdjustedDate] = useState(null);
  const lastCheckRef = useRef(0);

  const [allPositionedEvents, setAllPositionedEvents] = useState([]);
  const [minorEventsWithLanes, setMinorEventsWithLanes] = useState([]);
  const [majorEventsWithLanes, setMajorEventsWithLanes] = useState([]);
  const [coreMemoriesWithLanes, setCoreMemoriesWithLanes] = useState([]);
  const [minorPeriodsWithLanes, setMinorPeriodsWithLanes] = useState([]);
  const [genericEntriesWithLanes, setGenericEntriesWithLanes] = useState([]);
  const [positionedMajorPeriods, setPositionedMajorPeriods] = useState([]);

  const [yearlyMarkers, setYearlyMarkers] = useState([]);
  const [freezeTransitions, setFreezeTransitions] = useState(false);

  const [hideLabels, setHideLabels] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const [hoverPreview, setHoverPreview] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const DEFAULT_COLOR = "#e9e9e9ff";
  const BASIC_MARKER_COLOR = "#6b7280";
  const getColor = (seg) => seg.color || DEFAULT_COLOR;
  const knownTypes = new Set([
    "Major Event",
    "Minor Event",
    "Core Memory",
    "Minor Period",
    "Major Period",
  ]);
  let gradientParts = [];
  let currentPos = 0;

  const BASE_MARKER_Y = 44;

  const estimatedLabelWidth = (title) => title.length * 10;
  const baseVertical = 130;
  const laneSpacing = 35;
  const horizontalLength = 25;

  const barHeight = barRef.current?.offsetHeight || 0;
  const [dynamicBackground, setDynamicBackground] = useState("");

  const [isTransitioning, setIsTransitioning] = useState(false);

  const [selectedType, setSelectedType] = useState("");
  const [entryTypes, setEntryTypes] = useState([]);
  const selectableEntryTypes = entryTypes.filter(
    (type) => type.type !== "Major Period",
  );
  const isSelected = (type) => selectedType === type;
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    axios
      .get("https://127.0.0.1:8000/type/api")
      .then((response) => {
        setEntryTypes(response.data);
      })
      .catch((error) => {
        console.error("Error fetching entry types for timeline:", error);
      });
  }, []);

  useEffect(() => {
    // 1. Immediately hide labels (no animation)
    setShowLabels(false);
    setHideLabels(true);

    // 2. After 0ms, React applies new positions while invisible
    requestAnimationFrame(() => {
      // 3. After bar animation finishes (300ms), fade back in
      setTimeout(() => {
        setHideLabels(false); // allow opacity transition
        setShowLabels(true); // fade in
      }, 300); // match your bar resize duration
    });
  }, [zoom]);

  const [dragStartX, setDragStartX] = useState(0); // mouse position at mousedown
  const [panStartX, setPanStartX] = useState(0); // panX at mousedown
  const [panX, setPanX] = useState(0); // current pan
  const [didDrag, setDidDrag] = useState(false); // to block clicks
  const didDragRef = useRef(false);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    didDragRef.current = false;
    setDragStartX(e.clientX);
    setPanStartX(panX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const delta = e.clientX - dragStartX;
    if (Math.abs(delta) > 3) {
      didDragRef.current = true;
    }

    setPanX(panStartX + delta);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // don’t reset didDragRef here; we still need it for the click
    // you can reset it after the click fires if you want
  };

  // Measure bar width once & initially set Major Events as selected Type
  useLayoutEffect(() => {
    if (barRef.current) {
      setBarWidth(barRef.current.offsetWidth);
      const handleWheel = (e) => {
        e.preventDefault();
        if (e.shiftKey) {
          const current = scrollAdjustedDate || baseDate;
          const newDate = new Date(current);
          newDate.setDate(current.getDate() + (e.deltaY > 0 ? 1 : -1)); // scroll down = +1 day
          setScrollAdjustedDate(newDate);
        } else {
          setZoom((prev) => {
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            if (delta + prev < 0.5) return 0.5;
            else if (delta + prev > 5) return 5;
            else return delta + prev;
          });
        }
      };
      barRef.current.addEventListener("wheel", handleWheel, { passive: false });
    }
  }, []);

  useEffect(() => {
    if (!selectableEntryTypes.length) {
      return;
    }

    if (
      !selectedType ||
      !selectableEntryTypes.some((type) => type.type === selectedType)
    ) {
      setSelectedType(selectableEntryTypes[0].type);
    }
  }, [selectableEntryTypes, selectedType]);

  useEffect(() => {
    if (selectedType && onSelectedTypeChange) {
      onSelectedTypeChange(selectedType);
    }
  }, [onSelectedTypeChange, selectedType]);

  useLayoutEffect(() => {
    const majorPeriods = entries.filter(
      (ev) => ev.MemoryType.type === "Major Period",
    );
    const minorPeriods = entries.filter(
      (ev) => ev.MemoryType.type === "Minor Period",
    );
    const majorEvents = entries.filter(
      (ev) => ev.MemoryType.type === "Major Event",
    );
    const minorEvents = entries.filter(
      (ev) => ev.MemoryType.type === "Minor Event",
    );
    const coreMemories = entries.filter(
      (ev) => ev.MemoryType.type === "Core Memory",
    );
    const genericEntries = entries.filter(
      (ev) => !knownTypes.has(ev.MemoryType?.type),
    );

    // Computing all label positions
    const positionedMajorEvents = majorEvents.map((ev) => ({
      ...ev,
      x: ((new Date(ev.date_start) - startDate) / totalMs) * barWidth,
    }));

    const positionedMinorEvents = minorEvents.map((ev) => ({
      ...ev,
      x: ((new Date(ev.date_start) - startDate) / totalMs) * barWidth,
    }));

    const positionedCoreMemories = coreMemories.map((ev) => ({
      ...ev,
      x: ((new Date(ev.date_start) - startDate) / totalMs) * barWidth,
    }));
    const positionedGenericEntries = genericEntries.map((ev) => ({
      ...ev,
      x: ((new Date(ev.date_start) - startDate) / totalMs) * barWidth,
    }));
    setPositionedMajorPeriods(
      majorPeriods.map((ev) => ({
        ...ev,
        xStart:
          ((new Date(ev.date_start) - startDate) / totalMs) * barWidth * zoom,
        xEnd: ((new Date(ev.date_end) - startDate) / totalMs) * barWidth * zoom,
      })),
    );
    const positionedMinorPeriods = minorPeriods.map((ev) => ({
      ...ev,
      xStart:
        ((new Date(ev.date_start) - startDate) / totalMs) * barWidth * zoom,
      xEnd: ((new Date(ev.date_end) - startDate) / totalMs) * barWidth * zoom,
      x:
        (((new Date(ev.date_start) - startDate) / totalMs) * barWidth +
          ((new Date(ev.date_end) - startDate) / totalMs) * barWidth) /
        2,
    }));

    setMajorEventsWithLanes(
      addLanesToEvents(
        positionedMajorEvents.sort((a, b) => a.x - b.x),
        BASE_MARKER_Y,
        barHeight,
      ),
    );
    setMinorEventsWithLanes(
      addLanesToEvents(
        positionedMinorEvents.sort((a, b) => a.x - b.x),
        BASE_MARKER_Y,
        barHeight,
      ),
    );
    setCoreMemoriesWithLanes(
      addLanesToEvents(
        positionedCoreMemories.sort((a, b) => a.x - b.x),
        BASE_MARKER_Y,
        barHeight,
      ),
    );
    setGenericEntriesWithLanes(
      addLanesToEvents(
        positionedGenericEntries.sort((a, b) => a.x - b.x),
        BASE_MARKER_Y,
        barHeight,
      ),
    );
    setMinorPeriodsWithLanes(
      addLanesToEvents(
        positionedMinorPeriods.sort((a, b) => a.x - b.x),
        BASE_MARKER_Y,
        barHeight,
      ),
    );

    setAllPositionedEvents([
      ...positionedMajorEvents.map((ev) => ({
        ...ev,
        y: BASE_MARKER_Y,
      })),
      ...positionedMinorEvents.map((ev) => ({
        ...ev,
        y: BASE_MARKER_Y,
      })),
      ...positionedCoreMemories.map((ev) => ({
        ...ev,
        y: BASE_MARKER_Y,
      })),
      ...positionedGenericEntries.map((ev) => ({
        ...ev,
        y: BASE_MARKER_Y,
      })),
      ...positionedMinorPeriods.map((ev) => ({
        ...ev,
        y: BASE_MARKER_Y,
      })),
    ]);

    const majorPeriodSegments = majorPeriods.map((ev) => {
      const startFraction = (new Date(ev.date_start) - startDate) / totalMs;
      const endFraction = (new Date(ev.date_end) - startDate) / totalMs;
      return {
        ...ev,
        startPercent: Math.max(0, Math.min(100, startFraction * 100)),
        endPercent: Math.max(0, Math.min(100, endFraction * 100)),
      };
    });

    majorPeriodSegments.sort((a, b) => a.startPercent - b.startPercent);

    // Filling background before major periods, at the major periods' positions and after each major period
    for (const seg of majorPeriodSegments) {
      if (seg.startPercent > currentPos) {
        gradientParts.push(
          `${DEFAULT_COLOR} ${currentPos}% ${seg.startPercent}%`,
        );
      }
      gradientParts.push(
        `${getColor(seg)} ${seg.startPercent}% ${seg.endPercent}%`,
      );
      currentPos = seg.endPercent;
    }
    if (currentPos < 100) {
      gradientParts.push(`${DEFAULT_COLOR} ${currentPos}% 100%`);
    }

    setDynamicBackground(
      `linear-gradient(to right, ${gradientParts.join(", ")})`,
    );

    // === JANUARY MARKERS ===

    // 1. Full year count
    const totalYears = endDate.getFullYear() - startDate.getFullYear() + 1;

    // 2. Compute spacing based on full year count
    const spacing = (barWidth * zoom) / totalYears;

    // 3. Decide skip factor
    let skip = 1;
    if (spacing < 20) skip = 3;
    else if (spacing < 40) skip = 2;

    // 4. Build filtered list
    const yearlyMarkers = [];
    for (let i = 0; i < totalYears; i++) {
      if (i % skip === 0) {
        const year = startDate.getFullYear() + i;
        yearlyMarkers.push(new Date(year, 0, 1));
      }
    }

    // 5. Compute X positions using FULL timeline math
    const yearlyMarkersWithX = yearlyMarkers.map((date) => ({
      date,
      x: ((date - startDate) / totalMs) * barWidth * zoom,
    }));

    setYearlyMarkers(yearlyMarkersWithX);
  }, [entries, barWidth, barHeight, zoom]);

  const addLanesToEvents = (sortedEvents, markerYPosition, barHeight) => {
    let lanes = [];
    const markerYOffsetPx =
      ((markerYPosition - BASE_MARKER_Y) / 100) * barHeight;

    return sortedEvents.map((ev) => {
      const labelWidth = estimatedLabelWidth(ev.title);
      const labelStartX = ev.x + horizontalLength;
      const labelEndX = labelStartX + labelWidth;

      let lane = 0;
      while (lanes[lane] && lanes[lane] > labelStartX) lane++;
      lanes[lane] = labelEndX;

      return {
        ...ev,
        lane,
        verticalLength: baseVertical + lane * laneSpacing + markerYOffsetPx,
        horizontalLength,
        labelWidth,
      };
    });
  };

  useLayoutEffect(() => {
    function handleResize() {
      if (barRef.current) {
        setBarWidth(barRef.current.offsetWidth);
      }
    }

    // Listen for window resizes
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Tooltip text
  const tooltipText = hoveredEvent
    ? hoveredEvent.title +
      "\n" +
      new Date(hoveredEvent.date_start).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : scrollAdjustedDate
      ? scrollAdjustedDate.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : isOverBar
        ? baseDate.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";

  const renderEntryWithLeader = (ev, color, typeName, markerStyle) => {
    const angle = (80 * Math.PI) / 180;
    const dx = ev.verticalLength * Math.cos(angle);
    const dy = ev.verticalLength * Math.sin(angle);
    const verticalTop = `calc(${BASE_MARKER_Y}% - ${dy}px)`;
    const horizontalLeft = ev.x + dx;
    const isTypeSelected = isSelected(typeName);

    return (
      <div
        key={ev.id}
        onMouseEnter={(e) => {
          if (isTypeSelected) {
            scheduleHoverPreview(ev, e.clientX, e.clientY);
          }
        }}
        onMouseMove={(e) => {
          if (hoverPreview) {
            setHoverPreview(
              (prev) => prev && { ...prev, x: e.clientX, y: e.clientY },
            );
          }
        }}
        onMouseLeave={() => {
          clearHoverPreview();
        }}
        onClickCapture={(e) => {
          if (didDragRef.current) {
            e.stopPropagation();
            return;
          }
          e.stopPropagation();
          onEdit(ev);
        }}
        className={`${
          !isTypeSelected ? "opacity-10 cursor-default" : "cursor-pointer"
        } group transition-opacity duration-200 ease-out`}
      >
        <div
          className={`${markerStyle} absolute 
                  transition-[left,width] duration-200 ease-in-out
                `}
          style={{
            left:
              markerStyle == "period-minor"
                ? (ev.xStart + ev.xEnd) / 2
                : ev.x * zoom,
            top: `${BASE_MARKER_Y}%`,
            ...(markerStyle == "period-minor" && {
              width: ev.xEnd - ev.xStart,
            }),

            backgroundColor: ev.color ? ev.color : color,
          }}
        />

        <div
          className={`leader-vertical w-[2px] absolute 
                  transition-[left,width] duration-200 ease-in-out
                  ${isSelected(BASE_MARKER_Y) && "group-hover:w-[4px]"}
                `}
          style={{
            left: ev.x * zoom,
            height: `${ev.verticalLength}px`,
            top: `${BASE_MARKER_Y}%`,
            backgroundColor: ev.color ? ev.color : color,
          }}
        />

        <div
          className={`leader-horizontal h-[2px] absolute 
                  transition-[left,height] duration-200 ease-in-out
              ${isTypeSelected && "group-hover:h-[4px]"}
                `}
          style={{
            width: `${ev.horizontalLength}px`,
            left: `${dx + ev.x * zoom}px`,
            top: verticalTop,
            backgroundColor: ev.color ? ev.color : color,
          }}
        />

        <div
          className={`leader-label bg-white/80 text-sm absolute
    transition-[left,font-weight] duration-200 ease-in-out z-20
    ${isTypeSelected && "group-hover:font-bold group:hover"}
  `}
          style={{
            left: `${ev.x * zoom + dx + ev.horizontalLength + 4}px`,
            top: `calc(${BASE_MARKER_Y}% - ${dy}px - 8px)`,
          }}
        >
          {ev.title}
        </div>
      </div>
    );
  };

  useEffect(() => {
    setFreezeTransitions(true);

    // Allow React to apply new positions first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFreezeTransitions(false);
      });
    });
  }, [zoom]);

  function scheduleHoverPreview(ev, mouseX, mouseY) {
    clearTimeout(hoverTimeoutRef.current);

    hoverTimeoutRef.current = setTimeout(() => {
      setHoverPreview({
        x: mouseX,
        y: mouseY,
        title: ev.title,
        description: ev.description || "",
        date: new Date(ev.date_start),
      });
    }, 200);
  }

  function clearHoverPreview() {
    clearTimeout(hoverTimeoutRef.current);
    setHoverPreview(null);
  }

  return (
    <div>
      <div className="mb-[30vh] flex justify-center">
        <label className="flex items-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-2 shadow-sm">
          <span className="text-sm font-medium text-gray-600">Entry type</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="min-w-48 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white"
          >
            {selectableEntryTypes.map((type) => (
              <option key={type.id} value={type.type}>
                {type.type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="relative w-full before:overflow-hidden flex justify-center">
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative w-max mx-auto select-none"
          style={{ transform: `translateX(${panX}px)` }}
        >
          <div
            className="bar absolute w-max mx-auto relative h-[300px] rounded-lg transition-[width] duration-200 ease-in-out"
            id="timeline-bar"
            ref={barRef}
            onMouseMove={(e) => {
              const rect = barRef.current.getBoundingClientRect();
              if (e.clientY - rect.top > 0) {
                setCursorX(e.clientX - rect.left);
                setCursorY(e.clientY - rect.top);
                setScrollAdjustedDate(null);
                setIsOverBar(true);
              }
            }}
            onWheel={(e) => {
              if (e.shiftKey) {
                const current = scrollAdjustedDate || baseDate;
                const newDate = new Date(current);
                newDate.setDate(current.getDate() + (e.deltaY > 0 ? 1 : -1)); // scroll down = +1 day

                setScrollAdjustedDate(newDate);
              }
            }}
            onMouseLeave={() => {
              setHoveredEvent(null);
              setIsOverBar(false);
            }}
            onClick={() => {
              if (didDragRef.current) {
                didDragRef.current = false;
                return;
              }

              if (!hoveredEvent) {
                const dateToUse = scrollAdjustedDate || baseDate;
                onAdd(dateToUse, selectedType);
              }
            }}
            style={{
              background: dynamicBackground,
              width: `${initialWidth * zoom}px`,
              transformOrigin: "center",
              //borderRadius: zoom > 1 ? "0px" : "8px"
            }}
          >
            {/* Tooltip */}
            <div
              className="tooltip"
              id="tooltip"
              style={{
                position: "absolute",
                left: cursorX,
                top: cursorY,
                display: tooltipText ? "block" : "none",
                pointerEvents: "none",
              }}
            >
              {tooltipText}
            </div>
            {/* ======== MAJOR PERIOD LABELS ======== */}
            {positionedMajorPeriods != null &&
              positionedMajorPeriods.map((ev) => (
                <div
                  key={ev.id}
                  className="period-major transition-[left] duration-200 ease-in-out"
                  style={{
                    left: (ev.xStart + ev.xEnd) / 2,
                    color: ev.color,
                  }}
                >
                  <p>{ev.title}</p>
                </div>
              ))}

            {/* ======== YEAR MARKERS ======== */}
            {yearlyMarkers.map((m, i) => {
              return (
                <div
                  key={"marker-" + i}
                  className={`absolute bg-gray-500 top-[55%] bottom-[35%] 
                            ${hideLabels ? "opacity-0" : ""}
    ${showLabels ? "opacity-80 transition-opacity duration-200 ease-out" : "opacity-0"}
    }`}
                  style={{
                    left: m.x,
                    width: "2px",
                    transform: "translateX(-1px)",
                  }}
                />
              );
            })}

            {/* ======== YEAR LABELS ======== */}
            {yearlyMarkers.slice(0, -1).map((m, i) => {
              const next = yearlyMarkers[i + 1];
              const midX = (m.x + next.x) / 2;

              return (
                <div
                  key={"year-" + i}
                  className={`absolute text-gray-700 text-sm font-semibold z-2 cursor-default 
                    ${hideLabels ? "opacity-0" : ""}
    ${showLabels ? "opacity-100 transition-opacity duration-200 ease-out" : "opacity-0"}
    }`}
                  style={{
                    left: midX,
                    top: "60%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {m.date.getFullYear()}
                </div>
              );
            })}

            {/* ======== MINOR PERIOD LABELS ======== */}

            {minorPeriodsWithLanes.map((ev) => {
              return renderEntryWithLeader(
                ev,
                "#009632ff",
                "Minor Period",
                "period-minor",
              );
            })}

            {/* ======== MAJOR EVENTS ======== */}
            {majorEventsWithLanes.map((ev) => {
              return renderEntryWithLeader(
                ev,
                "#ff4d4d",
                "Major Event",
                "marker-major-event",
              );
            })}

            {/* ======== MINOR EVENTS ======== */}
            {minorEventsWithLanes.map((ev) => {
              return renderEntryWithLeader(
                ev,
                "#000000ff",
                "Minor Event",
                "marker-minor-event",
              );
            })}

            {/* ======== CORE MEMORIES ======== */}
            {coreMemoriesWithLanes.map((ev) => {
              return renderEntryWithLeader(
                ev,
                "#ffa600ff",
                "Core Memory",
                "marker-core-memory",
              );
            })}

            {/* ======== GENERIC ENTRIES ======== */}
            {genericEntriesWithLanes.map((ev) => {
              return renderEntryWithLeader(
                ev,
                BASIC_MARKER_COLOR,
                ev.MemoryType?.type || "Basic Entry",
                "marker-basic",
              );
            })}
          </div>
        </div>
      </div>
      {hoverPreview && (
        <div
          className="absolute bg-white shadow-lg rounded-lg p-3 text-sm pointer-events-none transition-opacity duration-150"
          style={{
            left: hoverPreview.x + 12,
            top: hoverPreview.y - 12,
            width: "240px", // 3:1 ratio feel
            aspectRatio: "3 / 1",
            opacity: 1,
            transform: "translateY(-100%)",
            zIndex: 9999,
          }}
        >
          <div className="font-semibold text-gray-900 mb-1">
            {hoverPreview.title}
          </div>

          <div className="text-gray-600 mb-1">
            {hoverPreview.description.length > 80
              ? hoverPreview.description.slice(0, 80) + "…"
              : hoverPreview.description}
          </div>

          <div className="text-gray-500 text-xs">
            {hoverPreview.date.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventTimelineView;
