import type { Metadata } from "next"
import { EB_Garamond } from "next/font/google"

import { AuthorClock } from "@/components/AuthorClock"

import styles from "./page.module.css"

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: "Author Clock",
  alternates: { canonical: "/author" },
}

export default function Author() {
  return (
    <>
      <div className={styles.paper} aria-hidden="true" />
      <div className={`${styles.screen} ${garamond.className}`}>
        <AuthorClock />
      </div>
    </>
  )
}
