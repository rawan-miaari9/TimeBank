import React, {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

type Category = {
  _id: string;
  name: string;
  status?: "active" | "inactive";
};

type ServiceResponse = {
  _id: string;
  categoryId: Category | null;
  title: string;
  description: string;
  locationType:
    | "online"
    | "in_person"
    | "both";
  estimatedDurationHours: number;
};

type StoredUser = {
  _id?: string;
  id?: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

const getCurrentUserId = (): string => {
  try {
    const value = localStorage.getItem("user");

    if (!value) {
      return "";
    }

    const user = JSON.parse(value) as StoredUser;

    return user._id || user.id || "";
  } catch {
    return "";
  }
};

const EditServicePage: React.FC = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const currentUserId = useMemo(
    () => getCurrentUserId(),
    []
  );

  const [categories, setCategories] = useState<
    Category[]
  >([]);

  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [locationType, setLocationType] =
    useState<
      "online" | "in_person" | "both"
    >("both");

  const [
    estimatedDurationHours,
    setEstimatedDurationHours,
  ] = useState("1");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [isAiLoading, setIsAiLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!id) {
          throw new Error(
            "Service ID is missing."
          );
        }

        const [serviceResponse, categoryResponse] =
          await Promise.all([
            fetch(`${API_URL}/services/${id}`),
            fetch(`${API_URL}/categories`),
          ]);

        const serviceData: ServiceResponse =
          await serviceResponse.json();

        const categoryData =
          await categoryResponse.json();

        if (!serviceResponse.ok) {
          throw new Error(
            (serviceData as unknown as {
              message?: string;
            }).message ||
              "Failed to load service."
          );
        }

        if (!categoryResponse.ok) {
          throw new Error(
            categoryData.message ||
              "Failed to load categories."
          );
        }

        setTitle(serviceData.title);

        setDescription(
          serviceData.description
        );

        setCategoryId(
          serviceData.categoryId?._id || ""
        );

        setLocationType(
          serviceData.locationType
        );

        setEstimatedDurationHours(
          String(
            serviceData.estimatedDurationHours
          )
        );

        setCategories(
          Array.isArray(categoryData)
            ? categoryData.filter(
                (category: Category) =>
                  category.status !== "inactive"
              )
            : []
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load service."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleAiEnhance = async () => {
    if (
      !description ||
      description.trim().length < 5
    ) {
      setError(
        "Please write a short description first so the AI has something to improve!"
      );
      return;
    }

    try {
      setIsAiLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/ai/optimize-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rawDescription: description,
            categories: categories.map(
              (category) => category.name
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "AI service failed"
        );
      }

      if (data.title) {
        setTitle(data.title);
      }

      if (data.enhancedDescription) {
        setDescription(data.enhancedDescription);
      }

      if (data.category) {
        const match = categories.find(
          (category) =>
            category.name.toLowerCase() ===
            String(data.category)
              .trim()
              .toLowerCase()
        );

        if (match) {
          setCategoryId(match._id);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI enhancement failed."
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (!id) {
        throw new Error(
          "Service ID is missing."
        );
      }

      if (!currentUserId) {
        throw new Error(
          "Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}/services/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            providerId: currentUserId,
            categoryId,
            title,
            description,
            locationType,
            estimatedDurationHours: Number(
              estimatedDurationHours
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update service."
        );
      }

      navigate("/my-services");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update service."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-10 text-center dark:bg-gray-900">
        Loading service...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-6 text-2xl font-bold">
          EDIT SERVICE
        </h1>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              Service Title
            </label>

            <input
              required
              maxLength={150}
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Category
            </label>

            <select
              required
              value={categoryId}
              onChange={(event) =>
                setCategoryId(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="">
                Select a category
              </option>

              {categories.map((category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium">
                Description
              </label>

              <button
                type="button"
                onClick={handleAiEnhance}
                disabled={isAiLoading}
                className="flex items-center gap-1 rounded-md bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {isAiLoading
                  ? "Optimizing..."
                  : "Enhance with AI"}
              </button>
            </div>

            <textarea
              required
              rows={5}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Location Type
            </label>

            <select
              value={locationType}
              onChange={(event) =>
                setLocationType(
                  event.target.value as
                    | "online"
                    | "in_person"
                    | "both"
                )
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="online">
                Online
              </option>

              <option value="in_person">
                In person
              </option>

              <option value="both">
                Online or in person
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Estimated Duration
            </label>

            <input
              required
              type="number"
              min="1"
              value={estimatedDurationHours}
              onChange={(event) =>
                setEstimatedDurationHours(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-5 dark:border-gray-700">
            <Link
              to="/my-services"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditServicePage;