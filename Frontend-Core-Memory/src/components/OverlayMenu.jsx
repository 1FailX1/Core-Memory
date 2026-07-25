import { useState, useEffect } from "react";
import axios from 'axios';

function OverlayMenu({ onClose, onSubmit, onDelete, initialData, entryTypes }) {
    const [isEditing, setIsEditing] = useState(!initialData?.title);
    // If creating a new entry → start in edit mode
    // If opening an existing entry → start in view mode

    const [memoryId, setMemoryId] = useState(initialData?.id || "");
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [type, setType] = useState(initialData?.MemoryType?.type || "Major Event");
    const [dateStart, setDateStart] = useState(initialData?.date_start || "");
    const [dateEnd, setDateEnd] = useState(initialData?.date_end || "");
    const [image, setImage] = useState(initialData?.image || null);
    const [color, setColor] = useState(initialData?.color || "");

    const isPeriodType = type === "Minor Period" || type === "Major Period";

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newEntry = {
            title,
            description,
            memoryTypeId: entryTypes.find((t) => t.type === type).id,
            dateStart,
            dateEnd,
            imageUrl: image ? image.name : null,
            color,
        };

        try {
            if (!initialData?.title) {
                const response = await axios.post("https://127.0.0.1:8000/memory/new", newEntry, {
                    headers: { "Content-Type": "application/json" }
                });
                if (onSubmit) onSubmit(response.data);
            } else {
                const response = await axios.patch(
                    `https://127.0.0.1:8000/memory/${initialData.id}/edit`,
                    newEntry,
                    { headers: { "Content-Type": "application/json" } }
                );
                if (onSubmit) onSubmit(response.data);
            }
        } catch (error) {
            console.error("Error saving entry:", error);
        }

        onClose();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setImage(file);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg w-full max-w-lg">

                {/* HEADER */}
                <div className="flex justify-between items-center p-2 px-4 mb-2 border-b border-gray-400">
                    <h2 className="text-sm text-gray-700">
                        {isEditing ? (initialData?.title ? "Edit Memory" : "Add Memory") : "Memory Details"}
                    </h2>

                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-gray-100 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* VIEW MODE */}
                {!isEditing && (
                    <div className="space-y-4 p-2 px-8">

                        <div>
                            <div className="text-lg font-bold">{title}</div>
                        </div>

                        <div className="pl-2 flex flex-col">
                            <div className="flex flex-row gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 text-gray-400">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                                </svg>
                                <div className="text-sm text-gray-500">Description</div>
                            </div>
                            <div className="whitespace-pre-line">{description || "—"}</div>
                        </div>

                        <div className="pl-2">
                            <div className="text-sm text-gray-500">Type</div>
                            <div>{type}</div>
                        </div>

                        <div className="flex flex-row justify-between">
                            <div className="pl-2">
                                <div className="text-sm text-gray-500">Color</div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border" style={{ background: color }} />
                                    <span>{color || "No color"}</span>
                                </div>
                            </div>

                            <div className=" pl-2 flex flex-col *:ml-auto">
                                <div className="flex flex-row gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 text-gray-400">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                    </svg>
                                    <div className="text-sm text-gray-500">Date</div>
                                </div>

                                {isPeriodType ? (
                                    <div>{new Date(dateStart).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} → {new Date(dateEnd).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</div>
                                ) : (
                                    <div>{new Date(dateStart).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</div>
                                )}
                            </div>
                        </div>

                        {image && (
                            <div>
                                <div className="text-sm text-gray-500">Image</div>
                                <div className="text-sm text-gray-600">{image.name || image}</div>
                            </div>
                        )}

                        <div className="flex justify-between pt-4 pb-4">
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex flex-row gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                    </svg>

                                    <span>Edit</span>
                                </button>
                            )}

                            <button
                                onClick={() => onDelete(memoryId)}
                                className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition flex flex-row gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>

                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* EDIT MODE */}
                {isEditing && (
                    <form onSubmit={handleSubmit} className="space-y-4 p-2 px-8">

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-gray-400 rounded px-3 py-2"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-400 rounded px-3 py-2"
                            />
                        </div>

                        {/* Color */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Color</label>
                            <input
                                type="text"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full border border-gray-400 rounded px-3 py-2"
                            />
                        </div>

                        {/* Image */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Image (optional)</label>
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                            {image && <p className="text-xs text-gray-500 mt-1">{image.name}</p>}
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full border border-gray-400 rounded px-3 py-2"
                            >
                                {entryTypes.map((t) => (
                                    <option key={t.id} value={t.type}>{t.type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dates */}
                        {isPeriodType ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={dateStart ? new Date(dateStart).toISOString().substring(0, 10) : ""}
                                        onChange={(e) => setDateStart(e.target.value)}
                                        className="w-full border border-gray-400 rounded px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={dateEnd ? new Date(dateEnd).toISOString().substring(0, 10) : ""}
                                        onChange={(e) => setDateEnd(e.target.value)}
                                        className="w-full border border-gray-400 rounded px-3 py-2"
                                    />
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium mb-1">Date of Event</label>
                                <input
                                    type="date"
                                    value={dateStart ? new Date(dateStart).toISOString().substring(0, 10) : ""}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    className="w-full border border-gray-400 rounded px-3 py-2"
                                />
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex justify-between py-4">
                            {initialData.title &&
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-2 bg-yellow-300 text-yellow-900 rounded hover:bg-yellow-400 transition flex flex-row gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                                    </svg>


                                    <span>View</span>
                                </button>
                            }

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex flex-row gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
                                    </svg>

                                    <span>Save</span>
                                </button>

                                {initialData.title &&
                                    <button
                                        onClick={() => onDelete(memoryId)}
                                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition flex flex-row gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>

                                        <span>Delete</span>
                                    </button>
                                }
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default OverlayMenu;