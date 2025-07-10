import { useEffect, useState } from "react"

const useFetch = (serverFunction, options = {}, observable = []) => {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const response = await serverFunction(options)

      const result = response.data
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...observable])

  return { data, error, loading, refesh: fetchData }
}

export default useFetch
