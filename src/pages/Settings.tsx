
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  ShieldCheck,
  Settings2,
  Pencil,
  Camera,
  Trash2,
} from "lucide-react";

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  profileImage?: string | null;
};

type AuthResponse = {
  message: string;
  user: CurrentUser;
};

export default function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [savingProfile, setSavingProfile] = useState(false);
const [profileMessage, setProfileMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const [profilePreview, setProfilePreview] = useState<
    string | null
  >(null);

  const [selectedImage, setSelectedImage] = useState<
    File | null
  >(null);
  const [savingImage, setSavingImage] = useState(false);
const [imageMessage, setImageMessage] = useState("");

  // Load logged-in user
  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (response.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load your profile.");
        }

        const data: AuthResponse = await response.json();

        if (!controller.signal.aborted) {
          setUser(data.user);
          setName(data.user.name);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, [navigate]);

  // Clean up temporary image URL when leaving the page
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // Cancel editing name
  function cancelEditing() {
    setName(user?.name ?? "");
    setEditing(false);
  }

  // Select profile image
  function handleProfileImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    // Remove previous temporary preview URL
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    // Create new image preview
    const previewUrl = URL.createObjectURL(file);

    previewUrlRef.current = previewUrl;

    setSelectedImage(file);
    setProfilePreview(previewUrl);

    event.target.value = "";
  }

  // Remove newly selected image
  function removeSelectedImage() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedImage(null);
    setProfilePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const displayedImage =
    profilePreview || user?.profileImage || null;

    
async function saveProfileImage() {
  if (!selectedImage) return;

  setSavingImage(true);
  setImageMessage("");

  try {
    const formData = new FormData();
    formData.append("image", selectedImage);

    const response = await fetch("/api/auth/profile-image", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    setUser(data.user);
    removeSelectedImage();
    setImageMessage("Profile picture saved successfully!");
  } catch (error) {
    setImageMessage(
      error instanceof Error ? error.message : "Upload failed"
    );
  } finally {
    setSavingImage(false);
  }
}


async function saveProfile() {
  if (!user) return;

  const trimmedName = name.trim();

  if (!trimmedName) {
    setProfileMessage("Full name is required.");
    return;
  }

  if (trimmedName.length > 100) {
    setProfileMessage("Full name must be 100 characters or fewer.");
    return;
  }

  setSavingProfile(true);
  setProfileMessage("");

  try {
    const response = await fetch("/api/auth/profile", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: trimmedName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to update profile");
    }

    setUser(data.user);
    setName(data.user.name);
    setEditing(false);
    setProfileMessage("Profile updated successfully!");
  } catch (error) {
    setProfileMessage(
      error instanceof Error ? error.message : "Unable to update profile"
    );
  } finally {
    setSavingProfile(false);
  }
}

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <div className="flex items-center gap-3">
          <Settings2
            size={28}
            className="text-blue-600"
          />

          <h1 className="text-3xl font-bold text-slate-900">
            Settings
          </h1>
        </div>

        <p className="mt-2 text-slate-500">
          Manage your TaskForge account information.
        </p>
      </div>

      {/* Profile card */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              My Profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your personal account details
            </p>
          </div>

          {user && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          )}
        </div>

        {loading ? (
          <p
            role="status"
            className="mt-6 text-slate-600"
          >
            Loading profile...
          </p>
        ) : error ? (
          <p
            role="alert"
            className="mt-6 text-red-600"
          >
            {error}
          </p>
        ) : user ? (
          <div className="mt-6 space-y-6">
            {/* Profile picture */}
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative h-24 w-24 shrink-0">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-blue-100 bg-blue-50">
                  {displayedImage ? (
                    <img
                      src={displayedImage}
                      alt={`${user.name}'s profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound
                      size={42}
                      className="text-blue-600"
                    />
                  )}
                </div>

                {/* Camera button */}
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  title="Upload profile picture"
                  aria-label="Upload profile picture"
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
                >
                  <Camera size={18} />
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  id="profile-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProfileImageChange}
                  className="sr-only"
                  aria-label="Choose profile picture"
                />
              </div>

{selectedImage && (
  <button
    type="button"
    onClick={saveProfileImage}
    disabled={savingImage}
    className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
  >
    {savingImage ? "Uploading..." : "Save Profile Picture"}
  </button>
)}

{imageMessage && (
  <p className="mt-2 text-sm text-gray-700">
    {imageMessage}
  </p>
)}

              {/* User details */}
              <div className="min-w-0">
                <h3 className="break-words text-lg font-semibold text-slate-900">
                  {user.name}
                </h3>

                <p className="break-all text-sm text-slate-500">
                  {user.email}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  JPG, PNG or WebP. Maximum 5 MB.
                </p>

                {selectedImage && (
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="mt-2 flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={15} />
                    Remove selected photo
                  </button>
                )}
              </div>
            </div>

            {/* Name and email */}
            <div className="grid gap-5 md:grid-cols-2">
              {/* Full name */}
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-3 top-3 text-slate-400"
                  />

                  <input
                    id="profile-name"
                    type="text"
                    value={
                      editing ? name : user.name
                    }
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    readOnly={!editing}
                    className={`w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none ${
                      editing
                        ? "bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        : "bg-slate-50"
                    }`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-3 text-slate-400"
                  />

                  <input
                    id="profile-email"
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>

           
{/* Edit controls */}
{editing && (
  <div className="flex flex-wrap justify-end gap-3">
    <button
      type="button"
      onClick={cancelEditing}
      disabled={savingProfile}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
    >
      Cancel
    </button>

    <button
      type="button"
      onClick={saveProfile}
      disabled={savingProfile || !name.trim()}
      className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {savingProfile ? "Saving..." : "Save Changes"}
    </button>
  </div>
)}

{profileMessage && (
  <p role="status" className="text-sm text-blue-600">
    {profileMessage}
  </p>
)}


            {/* Account status */}
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              <ShieldCheck size={20} />
              <span>
                Signed in to your TaskForge account
              </span>
            </div>

            {/* Image preview notice */}
            {selectedImage && (
              <p className="text-sm text-amber-700">
                Your new profile picture is only a preview.
                It has not been saved to your account yet.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-6 text-slate-500">
            No profile information available.
          </p>
        )}
      </section>
    </div>
  );
}
