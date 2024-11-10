import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl:"https://planzserver.onrender.com/",
    credentials: "include",
  }),
  reducerPath: "adminApi",
  tagTypes: ["Admins", "Events", "Users", "Committees"],
  endpoints: (build) => ({}),
});
 
