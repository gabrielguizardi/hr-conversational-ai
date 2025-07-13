import { useEffect, useState } from "react"

const useFetch = (serverFunction, options = {}, observable = []) => {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    console.log("🔍 useFetch - fetchData called")
    console.log("🔍 useFetch - serverFunction:", serverFunction)
    console.log("🔍 useFetch - options:", options)
    try {
      const response = await serverFunction(options)
      console.log("🔍 useFetch - response:", response)

      const result = response.data
      console.log("🔍 useFetch - result:", result)
      setData(result)
    } catch (err) {
      console.error("🔍 useFetch - error:", err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log("🔍 useFetch - useEffect triggered")
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...observable])

  return { data, error, loading, refesh: fetchData }
}

export default useFetch
