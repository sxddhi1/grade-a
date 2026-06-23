import { useState, useEffect } from 'react'
import axios from 'axios'

function StudentList() {

  // useState creates a variable called 'students' that starts as an empty array.
  // setStudents is the function you call to update it.
  const [students, setStudents] = useState([])

  // loading = true means "still waiting for data from Django"
  // we show a spinner while this is true
  const [loading, setLoading] = useState(true)

  // error stores any error message if the API call fails
  const [error, setError] = useState(null)

  // useEffect runs once when this component first loads on screen
  useEffect(() => {

    // Use environment variable for API URL (Vite requires VITE_ prefix and import.meta.env)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/students/'

    // axios.get() calls your Django API and waits for the response
    axios.get(apiUrl)
      .then(response => {
        // Validate that response.data is an array
        if (Array.isArray(response.data)) {
          // response.data is the JSON Django sent back
          // this puts all the students into our useState variable
          setStudents(response.data)
          setLoading(false)   // data arrived, stop showing spinner
        } else {
          // Handle invalid data format
          setError('Invalid data format from API. Expected an array.')
          setLoading(false)
        }
      })
      .catch(err => {
        // Log the error for debugging
        console.error('API Error:', err)
        // Show more informative error message
        setError(`Could not load students: ${err.message || 'Unknown error'}`)
        setLoading(false)
      })

  }, [])  // the empty [] means "run this once on load, never again"


  // --- What to show while loading ---
  if (loading) {
    return <p>Loading students...</p>
  }

  // --- What to show if there was an error ---
  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>
  }

  // --- What to show when data has arrived ---
  return (
    <div>
      <h2>All Students</h2>

      {/* Handle empty state - show message if no students */}
      {students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        /* map() loops over the students array and creates one card per student */
        /* This is like a for loop but written inside HTML */
        students.map(student => (

          // key={student.id} is required by React when making lists
          // React uses it to track which item is which
          <div key={student.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px', borderRadius: '8px' }}>
            <h3>{student.name}</h3>
            <p>Roll Number: {student.roll_number}</p>
            <p>Department: {student.department}</p>
            <p>Semester: {student.semester}</p>
          </div>

        ))
      )}
    </div>
  )
}

export default StudentList
// export default makes this component available to import in other files