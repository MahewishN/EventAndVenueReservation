import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

function Profile() {
  const [profile, setProfile] = useState(null);

  const [username, setUsername] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get("/api/users/me");

        setProfile(response.data);
        setUsername(response.data.username);
      } catch (error) {
        setProfileError(
          error.response?.data?.message || "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileUpdate = async (event) => {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    if (username.trim().length < 3) {
      setProfileError("Username must be at least 3 characters");
      return;
    }

    try {
      setUpdatingProfile(true);

      const response = await axiosInstance.patch("/api/users/me", {
        username: username.trim(),
      });

      setProfile(response.data);
      setUsername(response.data.username);

      setProfileMessage("Profile updated successfully");
    } catch (error) {
      setProfileError(
        error.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);

      await axiosInstance.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage("Password changed successfully");
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-slate-600">Loading profile...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-red-600">
          {profileError || "Unable to load profile"}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          My Profile
        </h1>

        <p className="mt-2 text-slate-600">
          Manage your account information and password.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Profile Information */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Profile Information
          </h2>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="mt-1 font-medium text-slate-900">
                {profile.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Role</p>
              <p className="mt-1 font-medium text-slate-900">
                {profile.role}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Account Status</p>
              <p
                className={`mt-1 font-medium ${
                  profile.active
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {profile.active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="mt-8">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />

            {profileError && (
              <p className="mt-3 text-sm text-red-600">
                {profileError}
              </p>
            )}

            {profileMessage && (
              <p className="mt-3 text-sm text-green-600">
                {profileMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={updatingProfile}
              className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatingProfile ? "Updating..." : "Update Profile"}
            </button>
          </form>
        </section>

        {/* Change Password */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Change Password
          </h2>

          <form onSubmit={handlePasswordChange} className="mt-6 space-y-4">
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Current Password
              </label>

              <div className="relative mt-2">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-20 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(!showCurrentPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-indigo-600"
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-700"
              >
                New Password
              </label>

              <div className="relative mt-2">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-20 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(!showNewPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-indigo-600"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Confirm New Password
              </label>

              <div className="relative mt-2">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-20 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-indigo-600"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600">
                {passwordError}
              </p>
            )}

            {passwordMessage && (
              <p className="text-sm text-green-600">
                {passwordMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Profile;
