import { useEffect, useLayoutEffect, useRef, useState } from "react";

function EventTimelineView({ entries, onEdit, onAdd }) {
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
    const baseDate = new Date(startDate.getTime() + (cursorX / (barWidth * zoom)) * totalMs);
    const [scrollAdjustedDate, setScrollAdjustedDate] = useState(null);
    const lastCheckRef = useRef(0);

    const [allPositionedEvents, setAllPositionedEvents] = useState([]);
    const [minorEventsWithLanes, setMinorEventsWithLanes] = useState([]);
    const [majorEventsWithLanes, setMajorEventsWithLanes] = useState([]);
    const [coreMemoriesWithLanes, setCoreMemoriesWithLanes] = useState([]);
    const [minorPeriodsWithLanes, setMinorPeriodsWithLanes] = useState([]);
    const [positionedMajorPeriods, setPositionedMajorPeriods] = useState([]);

    const [yearlyMarkers, setYearlyMarkers] = useState([]);
    const [freezeTransitions, setFreezeTransitions] = useState(false);

    const [hideLabels, setHideLabels] = useState(false);
    const [showLabels, setShowLabels] = useState(true);



    const [hoverPreview, setHoverPreview] = useState(null);
    const hoverTimeoutRef = useRef(null);

    const DEFAULT_COLOR = "#e9e9e9ff";
    const getColor = (seg) => seg.color || DEFAULT_COLOR;
    let gradientParts = [];
    let currentPos = 0;

    const BASE_MARKER_Y = 40;
    const markerYPositions = {
        "Major Event": 20,
        "Minor Event": 35,
        "Core Memory": 70,
        "Minor Period": 85
    };

    const estimatedLabelWidth = (title) => title.length * 10;
    const baseVertical = 130;
    const laneSpacing = 35;
    const horizontalLength = 25

    const barHeight = barRef.current?.offsetHeight || 0;
    const [dynamicBackground, setDynamicBackground] = useState("");

    const [isTransitioning, setIsTransitioning] = useState(false);

    const [selectedType, setSelectedType] = useState("");
    const isSelected = (type) => selectedType === type;
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        // 1. Immediately hide labels (no animation)
        setShowLabels(false);
        setHideLabels(true);

        // 2. After 0ms, React applies new positions while invisible
        requestAnimationFrame(() => {
            // 3. After bar animation finishes (300ms), fade back in
            setTimeout(() => {
                setHideLabels(false);   // allow opacity transition
                setShowLabels(true);    // fade in
            }, 300); // match your bar resize duration
        });
    }, [zoom]);



    const [dragStartX, setDragStartX] = useState(0);   // mouse position at mousedown
    const [panStartX, setPanStartX] = useState(0);     // panX at mousedown
    const [panX, setPanX] = useState(0);               // current pan
    const [didDrag, setDidDrag] = useState(false);     // to block clicks
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
                        if (delta + prev < 0.5) return 0.5
                        else if (delta + prev > 5) return 5
                        else return (delta + prev)
                    })

                }
            };
            barRef.current.addEventListener("wheel", handleWheel, { passive: false });
        }
        setSelectedType('Major Event')
    }, []);

    useLayoutEffect(() => {
        const majorPeriods = entries.filter(ev => ev.MemoryType.type === "Major Period");
        const minorPeriods = entries.filter(ev => ev.MemoryType.type === "Minor Period");
        const majorEvents = entries.filter(ev => ev.MemoryType.type === "Major Event");
        const minorEvents = entries.filter(ev => ev.MemoryType.type === "Minor Event");
        const coreMemories = entries.filter(ev => ev.MemoryType.type === "Core Memory");


        // Computing all label positions
        const positionedMajorEvents = majorEvents.map(ev => ({
            ...ev,
            x: ((new Date(ev.date_start) - startDate) / totalMs) * barWidth,
        }));

        const positionedMinorEvents = minorEvents.map(ev => ({
            ...ev,
            x: ((new Date(ev.date_start) - startDate) / totalMs) * barWidth
        }));

        const positionedCoreMemories = coreMemories.map(ev => ({
            ...ev,
            x: ((new Date(ev.date_start) - startDate) / totalMs) * barWidth
        }));
        setPositionedMajorPeriods(majorPeriods.map(ev => ({
            ...ev,
            xStart: ((new Date(ev.date_start) - startDate) / totalMs) * barWidth * zoom,
            xEnd: ((new Date(ev.date_end) - startDate) / totalMs) * barWidth * zoom
        })));
        const positionedMinorPeriods = minorPeriods.map(ev => ({
            ...ev,
            xStart: ((new Date(ev.date_start) - startDate) / totalMs) * barWidth * zoom,
            xEnd: ((new Date(ev.date_end) - startDate) / totalMs) * barWidth * zoom,
            x: ((((new Date(ev.date_start) - startDate) / totalMs) * barWidth + ((new Date(ev.date_end) - startDate) / totalMs) * barWidth) / 2)
        }));

        setMajorEventsWithLanes(addLanesToEvents(positionedMajorEvents.sort((a, b) => a.x - b.x), markerYPositions['Major Event'], barHeight));
        setMinorEventsWithLanes(addLanesToEvents(positionedMinorEvents.sort((a, b) => a.x - b.x), markerYPositions['Minor Event'], barHeight));
        setCoreMemoriesWithLanes(addLanesToEvents(positionedCoreMemories.sort((a, b) => a.x - b.x), markerYPositions['Core Memory'], barHeight));
        setMinorPeriodsWithLanes(addLanesToEvents(positionedMinorPeriods.sort((a, b) => a.x - b.x), markerYPositions['Minor Period'], barHeight));

        setAllPositionedEvents([
            ...positionedMajorEvents.map(ev => ({ ...ev, y: markerYPositions["Major Event"] })),
            ...positionedMinorEvents.map(ev => ({ ...ev, y: markerYPositions["Minor Event"] })),
            ...positionedCoreMemories.map(ev => ({ ...ev, y: markerYPositions["Core Memory"] })),
            ...positionedMinorPeriods.map(ev => ({ ...ev, y: markerYPositions["Minor Period"] }))
        ]);

        const majorPeriodSegments = majorPeriods.map(ev => {
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
                    `${DEFAULT_COLOR} ${currentPos}% ${seg.startPercent}%`
                );
            }
            gradientParts.push(
                `${getColor(seg)} ${seg.startPercent}% ${seg.endPercent}%`
            );
            currentPos = seg.endPercent;
        }
        if (currentPos < 100) {
            gradientParts.push(`${DEFAULT_COLOR} ${currentPos}% 100%`);
        }

        setDynamicBackground(`linear-gradient(to right, ${gradientParts.join(", ")})`)

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
        const yearlyMarkersWithX = yearlyMarkers.map(date => ({
            date,
            x: ((date - startDate) / totalMs) * barWidth * zoom
        }));

        setYearlyMarkers(yearlyMarkersWithX);

    }, [entries, barWidth, barHeight, zoom])

    const addLanesToEvents = (sortedEvents, markerYPosition, barHeight) => {
        let lanes = [];
        const markerYOffsetPx = ((markerYPosition - BASE_MARKER_Y) / 100) * barHeight;

        return sortedEvents.map(ev => {
            const labelWidth = estimatedLabelWidth(ev.title);
            const labelStartX = ev.x + horizontalLength;
            const labelEndX = labelStartX + labelWidth;

            let lane = 0
            while (lanes[lane] && lanes[lane] > labelStartX) lane++;
            lanes[lane] = labelEndX;

            return {
                ...ev,
                lane,
                verticalLength: baseVertical + lane * laneSpacing + markerYOffsetPx,
                horizontalLength,
                labelWidth
            };
        })
    }

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
        ? hoveredEvent.title + "\n" + new Date(hoveredEvent.date_start)
            .toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        : scrollAdjustedDate
            ? scrollAdjustedDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
            : isOverBar
                ? baseDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                : "";

    const renderEntryWithLeader = (ev, color, markerYPosition, markerStyle) => {
        const angle = 80 * Math.PI / 180;
        const dx = ev.verticalLength * Math.cos(angle);
        const dy = ev.verticalLength * Math.sin(angle);
        const verticalTop = `calc(${markerYPositions[markerYPosition]}% - ${dy}px)`;
        const horizontalLeft = ev.x + dx;

        return (
            <div
                key={ev.id}
                onMouseEnter={(e) => {
                    if (isSelected(markerYPosition)) {
                        scheduleHoverPreview(ev, e.clientX, e.clientY);
                    }
                }}
                onMouseMove={(e) => {
                    if (hoverPreview) {
                        setHoverPreview(prev => prev && { ...prev, x: e.clientX, y: e.clientY });
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

                className={`${!isSelected(markerYPosition)
                    ? "opacity-10 cursor-default"
                    : "cursor-pointer"
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
                        top: `${markerYPositions[markerYPosition]}%`,
                        ...(markerStyle == "period-minor" && {
                            width: ev.xEnd - ev.xStart,
                        }),

                        backgroundColor: ev.color ? ev.color : color,

                    }}
                />

                <div
                    className={`leader-vertical w-[2px] absolute 
                  transition-[left,width] duration-200 ease-in-out
                  ${isSelected(markerYPosition) && "group-hover:w-[4px]"}
                `}

                    style={{
                        left: ev.x * zoom,
                        height: `${ev.verticalLength}px`,
                        top: `${markerYPositions[markerYPosition]}%`,
                        backgroundColor: ev.color ? ev.color : color,
                    }}
                />

                <div
                    className={`leader-horizontal h-[2px] absolute 
                  transition-[left,height] duration-200 ease-in-out
                  ${isSelected(markerYPosition) && "group-hover:h-[4px]"}
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
    ${isSelected(markerYPosition) && "group-hover:font-bold group:hover"}
  `}
                    style={{
                        left: `${ev.x * zoom + dx + ev.horizontalLength + 4}px`,
                        top: `calc(${markerYPositions[markerYPosition]}% - ${dy}px - 8px)`
                    }}
                >
                    {ev.title}
                </div>

            </div>

        );
    }

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
                date: new Date(ev.date_start)
            });
        }, 200);
    }

    function clearHoverPreview() {
        clearTimeout(hoverTimeoutRef.current);
        setHoverPreview(null);
    }

    return (
        <div>
            <div className="mb-[30vh] flex flex-row justify-center *:transition-all *:duration-100 *:ease-in">

                {/* Major Memory */}
                <button
                    onClick={() => setSelectedType("Major Event")}
                    className={
                        `px-2 py-2 border-l-2 border-t-2 border-b-2 rounded-l-xl
       ${isSelected("Major Event")
                            ? "transitionbg-orange-200 text-orange-700 border-orange-300 shadow-[0_8px_20px_rgba(0,0,0,0.3)] ("
                            : "bg-orange-600 text-orange-100 border-red-700 hover:bg-orange-200 hover:text-orange-700 hover:border-orange-300"
                        }`
                    }
                >
                    Major Memory
                </button>

                {/* Minor Memory */}
                <button
                    onClick={() => setSelectedType("Minor Event")}
                    className={
                        `px-2 py-2 border-t-2 border-b-2
       ${isSelected("Minor Event")
                            ? "bg-gray-200 text-gray-600 border-gray-300 shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
                            : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-200 hover:text-gray-600 hover:border-gray-300"
                        }`
                    }
                >
                    Minor Memory
                </button>

                {/* Core Memory */}
                <button
                    onClick={() => setSelectedType("Core Memory")}
                    className={
                        `px-2 py-2 border-t-2 border-b-2
       ${isSelected("Core Memory")
                            ? "bg-yellow-200 text-yellow-600 border-yellow-300 shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
                            : "bg-yellow-500 text-yellow-100 border-yellow-600 hover:bg-yellow-200 hover:text-yellow-600 hover:border-yellow-300"
                        }`
                    }
                >
                    Core Memory
                </button>

                {/* Minor Period */}
                <button
                    onClick={() => setSelectedType("Minor Period")}
                    className={
                        `px-2 py-2 border-t-2 border-b-2 border-r-2 rounded-r-xl
       ${isSelected("Minor Period")
                            ? "bg-green-300 text-green-700 border-green-400 shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
                            : "bg-green-700 text-green-100 border-green-800 hover:bg-green-300 hover:text-green-700 hover:border-green-400"
                        }`
                    }
                >
                    Minor Period
                </button>

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
                            setIsOverBar(false)
                        }}
                        onClick={() => {
                            if (didDragRef.current) {
                                didDragRef.current = false;
                                return;
                            }

                            if (!hoveredEvent) {
                                const dateToUse = scrollAdjustedDate || baseDate;
                                onAdd(dateToUse);
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
                                pointerEvents: "none"
                            }}
                        >
                            {tooltipText}
                        </div>
                        {/* ======== MAJOR PERIOD LABELS ======== */}
                        {positionedMajorPeriods != null && positionedMajorPeriods.map(ev => (
                            <div
                                key={ev.id}
                                className="period-major transition-[left] duration-200 ease-in-out"
                                style={{
                                    left: (ev.xStart + ev.xEnd) / 2,
                                    color: ev.color
                                }}
                            ><p>
                                    {ev.title}
                                </p>
                            </div>
                        ))}

                        {/* ======== YEAR MARKERS ======== */}
                        {yearlyMarkers.map((m, i) => {
                            return (
                                <div
                                    key={"marker-" + i}
                                    className={`absolute bg-gray-500 top-[45%] bottom-[45%] 
                            ${hideLabels ? "opacity-0" : ""}
    ${showLabels ? "opacity-80 transition-opacity duration-200 ease-out" : "opacity-0"}
    }`}
                                    style={{
                                        left: m.x,
                                        width: "2px",
                                        transform: "translateX(-1px)"
                                    }}
                                />)
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
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                    }}
                                >
                                    {m.date.getFullYear()}
                                </div>
                            );
                        })}


                        {/* ======== MINOR PERIOD LABELS ======== */}

                        {minorPeriodsWithLanes.map(ev => {
                            return renderEntryWithLeader(ev, "#009632ff", 'Minor Period', "period-minor");
                        })}

                        {/* ======== MAJOR EVENTS ======== */}
                        {majorEventsWithLanes.map(ev => {
                            return renderEntryWithLeader(ev, "#ff4d4d", 'Major Event', "marker-major-event");
                        })}

                        {/* ======== MINOR EVENTS ======== */}
                        {minorEventsWithLanes.map(ev => {
                            return renderEntryWithLeader(ev, "#000000ff", 'Minor Event', "marker-minor-event");
                        })}

                        {/* ======== CORE MEMORIES ======== */}
                        {coreMemoriesWithLanes.map(ev => {
                            return renderEntryWithLeader(ev, "#ffa600ff", 'Core Memory', "marker-core-memory")
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
                        width: "240px",          // 3:1 ratio feel
                        aspectRatio: "3 / 1",
                        opacity: 1,
                        transform: "translateY(-100%)",
                        zIndex: 9999
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
                            day: "numeric"
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventTimelineView;