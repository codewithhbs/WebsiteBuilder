import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import ImagePicker from "../../components/ImagePicker";

const SCHEMAS = {
  about: {
    title: "About",
    icon: "bi-info-circle",
    image: "image",
    fields: [
      {
        name: "heading",
        label: "Heading",
        type: "text",
      },
      {
        name: "shortText",
        label: "Short Description",
        type: "textarea",
      },
      {
        name: "longText",
        label: "Long Description",
        type: "textarea",
        rows: 6,
      },
    ],
    list: {
      name: "highlights",
      label: "Highlights",
      help: "One per line",
    },
  },

  contact: {
    title: "Contact",
    icon: "bi-envelope",
    fields: [
      {
        name: "heading",
        label: "Section Heading",
        type: "text",
      },
      {
        name: "address",
        label: "Address",
        type: "textarea",
      },
      {
        name: "phone",
        label: "Phone",
        type: "text",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
      },
      {
        name: "workingHours",
        label: "Working Hours",
        type: "text",
      },
      {
        name: "mapEmbedUrl",
        label: "Google Map Embed URL",
        type: "text",
      },
    ],
  },

  footer: {
    title: "Footer",
    icon: "bi-layout-text-sidebar",
    fields: [
      {
        name: "tagline",
        label: "Tagline",
        type: "text",
      },
      {
        name: "copyrightText",
        label: "Copyright Text",
        type: "text",
      },
    ],

    socials: true,
    columns: true,
  },

  seo: {
    title: "SEO",
    icon: "bi-search",
    image: "ogImage",
    fields: [
      {
        name: "title",
        label: "Page Title",
        type: "text",
      },
      {
        name: "description",
        label: "Meta Description",
        type: "textarea",
      },
    ],

    list: {
      name: "keywords",
      label: "Keywords",
      help: "One per line",
    },
  },
};

const SOCIAL_FIELDS = [
  {
    key: "facebook",
    icon: "bi-facebook",
  },
  {
    key: "instagram",
    icon: "bi-instagram",
  },
  {
    key: "twitter",
    icon: "bi-twitter-x",
  },
  {
    key: "linkedin",
    icon: "bi-linkedin",
  },
  {
    key: "youtube",
    icon: "bi-youtube",
  },
  {
    key: "whatsapp",
    icon: "bi-whatsapp",
  },
  {
    key: "website",
    icon: "bi-globe",
  },
];

export default function FlatSection({
  site,
  section,
  reload,
}) {
  const schema = SCHEMAS[section];

  const initial = site[section] || {};

  const [form, setForm] = useState(() => {
    const obj = {};

    schema.fields.forEach((f) => {
      obj[f.name] = initial[f.name] || "";
    });

    if (schema.list) {
      obj[schema.list.name] = (
        initial[schema.list.name] || []
      ).join("\n");
    }

    if (schema.socials) {
      obj.socialLinks = {
        ...SOCIAL_FIELDS.reduce(
          (a, s) => ({
            ...a,
            [s.key]: "",
          }),
          {}
        ),
        ...(initial.socialLinks || {}),
      };
    }

    if (schema.columns) {
      obj.columns =
        initial.columns?.length > 0
          ? initial.columns
          : [
              {
                title: "",
                links: [
                  {
                    label: "",
                    url: "",
                  },
                ],
              },
            ];
    }

    return obj;
  });

  const [imgFile, setImgFile] = useState(null);

  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);

    try {
      const payload = {};

      schema.fields.forEach((f) => {
        payload[f.name] = form[f.name];
      });

      if (schema.list) {
        payload[schema.list.name] = form[
          schema.list.name
        ]
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if (schema.socials) {
        payload.socialLinks =
          form.socialLinks;
      }

      if (schema.columns) {
        payload.columns = form.columns;
      }

      const fd = new FormData();

      fd.append(
        "payload",
        JSON.stringify(payload)
      );

      if (imgFile && schema.image) {
        fd.append(schema.image, imgFile);
      }

      await api.patch(
        `/employee/websites/${site._id}/section/${section}`,
        fd
      );

      toast.success(
        `${schema.title} saved`
      );

      reload();

    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateColumn = (
    colIndex,
    key,
    value
  ) => {
    const updated = [...form.columns];

    updated[colIndex][key] = value;

    setForm({
      ...form,
      columns: updated,
    });
  };

  const updateLink = (
    colIndex,
    linkIndex,
    key,
    value
  ) => {
    const updated = [...form.columns];

    updated[colIndex].links[linkIndex][key] =
      value;

    setForm({
      ...form,
      columns: updated,
    });
  };

  const addColumn = () => {
    setForm({
      ...form,
      columns: [
        ...form.columns,
        {
          title: "",
          links: [
            {
              label: "",
              url: "",
            },
          ],
        },
      ],
    });
  };

  const removeColumn = (index) => {
    const updated = [...form.columns];

    updated.splice(index, 1);

    setForm({
      ...form,
      columns: updated,
    });
  };

  const addLink = (colIndex) => {
    const updated = [...form.columns];

    updated[colIndex].links.push({
      label: "",
      url: "",
    });

    setForm({
      ...form,
      columns: updated,
    });
  };

  const removeLink = (
    colIndex,
    linkIndex
  ) => {
    const updated = [...form.columns];

    updated[colIndex].links.splice(
      linkIndex,
      1
    );

    setForm({
      ...form,
      columns: updated,
    });
  };

  return (
    <div>

      <div className="d-flex align-items-center mb-3">
        <i
          className={`bi ${schema.icon} text-primary fs-5 me-2`}
        ></i>

        <h6 className="mb-0">
          {schema.title}
        </h6>
      </div>

      {schema.image && (
        <div className="mb-3">
          <ImagePicker
            label="Image"
            currentUrl={
              initial[schema.image]?.url
            }
            onChange={setImgFile}
          />
        </div>
      )}

      {schema.fields.map((f) => (
        <div
          className="mb-3"
          key={f.name}
        >
          <label className="form-label fw-semibold">
            {f.label}
          </label>

          {f.type === "textarea" ? (
            <textarea
              className="form-control"
              rows={f.rows || 3}
              value={form[f.name]}
              onChange={(e) =>
                setForm({
                  ...form,
                  [f.name]:
                    e.target.value,
                })
              }
            />
          ) : (
            <input
              type={f.type}
              className="form-control"
              value={form[f.name]}
              onChange={(e) =>
                setForm({
                  ...form,
                  [f.name]:
                    e.target.value,
                })
              }
            />
          )}

          {f.help && (
            <div className="form-text">
              {f.help}
            </div>
          )}
        </div>
      ))}

      {schema.list && (
        <div className="mb-3">
          <label className="form-label fw-semibold">
            {schema.list.label}
          </label>

          <textarea
            className="form-control"
            rows="4"
            value={
              form[schema.list.name]
            }
            onChange={(e) =>
              setForm({
                ...form,
                [schema.list.name]:
                  e.target.value,
              })
            }
          />

          <div className="form-text">
            {schema.list.help}
          </div>
        </div>
      )}

      {schema.socials && (
        <>
          <hr className="my-4" />

          <h6 className="mb-3">
            <i className="bi bi-share me-2"></i>
            Social Links
          </h6>

          <div className="row g-3">
            {SOCIAL_FIELDS.map((s) => (
              <div
                className="col-md-6"
                key={s.key}
              >
                <label className="form-label small fw-semibold text-capitalize">
                  <i
                    className={`bi ${s.icon} me-1`}
                  ></i>

                  {s.key}
                </label>

                <input
                  className="form-control"
                  value={
                    form.socialLinks[
                      s.key
                    ]
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialLinks: {
                        ...form.socialLinks,
                        [s.key]:
                          e.target
                            .value,
                      },
                    })
                  }
                  placeholder={`https://${s.key}.com`}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {schema.columns && (
        <>
          <hr className="my-4" />

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">
              <i className="bi bi-columns-gap me-2"></i>
              Footer Columns
            </h6>

            <button
              type="button"
              className="btn btn-sm btn-dark"
              onClick={addColumn}
            >
              <i className="bi bi-plus-lg me-1"></i>
              Add Column
            </button>
          </div>

          {form.columns.map(
            (column, colIndex) => (
              <div
                className="card border-0 shadow-sm mb-4"
                key={colIndex}
              >
                <div className="card-body">

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">
                      Column{" "}
                      {colIndex + 1}
                    </h6>

                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        removeColumn(
                          colIndex
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Column Title
                    </label>

                    <input
                      className="form-control"
                      value={
                        column.title
                      }
                      onChange={(e) =>
                        updateColumn(
                          colIndex,
                          "title",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <h6 className="mb-3">
                    Links
                  </h6>

                  {column.links.map(
                    (
                      link,
                      linkIndex
                    ) => (
                      <div
                        className="border rounded p-3 mb-3"
                        key={
                          linkIndex
                        }
                      >
                        <div className="row g-3">

                          <div className="col-md-5">
                            <label className="form-label">
                              Label
                            </label>

                            <input
                              className="form-control"
                              value={
                                link.label
                              }
                              onChange={(
                                e
                              ) =>
                                updateLink(
                                  colIndex,
                                  linkIndex,
                                  "label",
                                  e
                                    .target
                                    .value
                                )
                              }
                            />
                          </div>

                          <div className="col-md-5">
                            <label className="form-label">
                              URL
                            </label>

                            <input
                              className="form-control"
                              value={
                                link.url
                              }
                              onChange={(
                                e
                              ) =>
                                updateLink(
                                  colIndex,
                                  linkIndex,
                                  "url",
                                  e
                                    .target
                                    .value
                                )
                              }
                            />
                          </div>

                          <div className="col-md-2 d-flex align-items-end">
                            <button
                              type="button"
                              className="btn btn-danger w-100"
                              onClick={() =>
                                removeLink(
                                  colIndex,
                                  linkIndex
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>

                        </div>
                      </div>
                    )
                  )}

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() =>
                      addLink(colIndex)
                    }
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    Add Link
                  </button>

                </div>
              </div>
            )
          )}
        </>
      )}

      <button
        className="btn btn-primary mt-3"
        onClick={save}
        disabled={saving}
      >
        {saving ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Saving...
          </>
        ) : (
          <>
            <i className="bi bi-check-lg me-1"></i>
            Save {schema.title}
          </>
        )}
      </button>

    </div>
  );
}