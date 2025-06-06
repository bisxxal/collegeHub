 
'use client';
import { useEffect, useState } from "react";
import { getAttendanceForLesson, updateAllAttendance } from "@/server/form.actions";
import toast from 'react-hot-toast';
import { getStudentsForLesson } from "@/server/server.actions";
import Secleton from "../Skeleton";
import { LuLoader } from "react-icons/lu";

interface Student {
  id: string;
  name: string;
  surname: string;
}

interface Lessons {
  id: number;
  name: string;
}

interface AttendanceFormProps {
  lessons: Lessons[];
  collage: string;
}

const getDaysInMonth = (month: number, year: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const AttendanceForm: React.FC<AttendanceFormProps> = ({ lessons, collage }) => {
  const [attendance, setAttendance] = useState<{ [key: string]: boolean }>({});
  const [lessonId, setLessonId] = useState<number>(() => lessons?.[0]?.id ?? 0);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  const daysInMonth = getDaysInMonth(month, year);
  const today = new Date().toDateString();

  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      setLoading(true);
      const studentsResponse = await getStudentsForLesson(lessonId);
      if (studentsResponse.success) {
        setStudents(studentsResponse.data);
      }

      const attendanceResponse = await getAttendanceForLesson(lessonId, year, month);
      if (attendanceResponse.success) {
        const fetchedAttendance = attendanceResponse.data;
        const newAttendanceState: { [key: string]: boolean } = {};

        fetchedAttendance.forEach((record: { date: Date; studentId: string; present: boolean }) => {
          const key = `${record.studentId}-${new Date(record.date).toDateString()}`;
          newAttendanceState[key] = record.present;
        });

        setAttendance(newAttendanceState);
      }
      setLoading(false);
    };

    fetchStudentsAndAttendance();
  }, [lessonId, month, year]);

  const handleCheckboxChange = (studentId: string, date: Date, isChecked: boolean) => {
    const dateString = date.toDateString();
    setAttendance((prev) => ({
      ...prev,
      [`${studentId}-${dateString}`]: isChecked,
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    const attendancePayload = students.map((student) => {
      const date = new Date();
      const dateString = date.toDateString();
      return {
        studentId: student.id,
        lessonId,
        date,
        present: attendance[`${student.id}-${dateString}`] || false,
        collage,
      };
    });

    try {
      await updateAllAttendance(attendancePayload);
      toast.success("Attendance submitted successfully!");
    } catch (err) {
      toast.error("Failed to submit attendance.");
    } finally {
      setSaving(false);
    }
  };

  if (!lessons || lessons.length === 0) {
    return <div className="text-center text-gray-500 p-5">No subjects found</div>;
  }

  return (
    <div className="w-[1270px] overflow-x-auto max-lg:px-2">
      <h2 className="text-lg font-semibold text-gray-500">
        Attendance for {new Date().toLocaleString("default", { dateStyle: 'full' })}
      </h2>

      <div className="w-full items-end flex gap-5 item s-center my-2 justify-end pr-40 max-md:pr-0">
        <h1 className="text text-zinc-500 whitespace-nowrap">Select subject</h1>
        <select
          className="ring-[1.5px] bg-[#00000037]   ring-[#ffffff23] p-1 rounded-2xl text-sm w-[200px]"
          value={lessonId} onChange={(e) => setLessonId(parseInt(e.target.value))}>
          {lessons.map((lesson) => (
            <option
              className="bg-[#000000c0] option border-y-[.3px] border-zinc-600"
              value={lesson.id}
              key={lesson.id}
            >
              {lesson.name}
            </option>
          ))}
        </select>
      </div>

      {!loading &&students &&  <div className="flex items-center w-full max-lg:w-[1270px]">
      <h1 className="w-[173px]">Student name</h1>
      <div className={` grid grid-cols-[repeat(31,_minmax(20px,_1fr))] m-5 text-base w-full`}>
          {daysInMonth.map((date) => (
            <div
              key={date.toDateString()}
              className={`$${date.toDateString() === today ? ' buttonbg  cursor-default ' : 'bg-[#6f16ff2c] opacity-45 cursor-not-allowed '} w-5 h-5 flex items-center justify-center rounded day-block`}
            >
              <span>{date.getDate()}</span>
            </div>
          ))}
        </div>
      </div>}

      <div className="min-h-[90vh]">
        {loading && <Secleton boxes={10} width="w-[100%] !h-12" />}
        {students.length === 0 && !loading ? (
          <h1 className='text-center flex items-center justify-center h-full w-full text-xl mt-5'>
            NO STUDENTS FOUND
          </h1>
        ) : (
          <div>
            {!loading &&students.map((student) => (
              <div key={student.id} className="mb-5 w-[1270px] h-12 sidebarbg border border-[#ffffff0b]  px-3 rounded-xl py-2 flex items-center">
                <div className="text-sm w-[153px] flex items-center ">
                  {student.name} {student.surname}
                </div>
                <div className=" grid grid-cols-[repeat(31,_minmax(20px,_1fr))] ml-[16px] mr-[10px] text-sm w-full ">
                  {daysInMonth.map((date) => (
                    <div key={`${student.id}-${date.toDateString()}`} className="w-8 h-8 flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="disabled:accent-red-600  accent-[#335cff] disabled:cursor-not-allowed disabled:opacity-25"
                        checked={attendance[`${student.id}-${date.toDateString()}`] || false}
                        onChange={(e) => handleCheckboxChange(student.id, date, e.target.checked)}
                        disabled={date.toDateString() !== today}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!loading  && <button
              className="buttonbg w-full flex items-center justify-center mt-5 py-3 rounded-xl font-semibold text-white" onClick={handleSubmit} disabled={saving}>
              {saving ? <h1 className=' animate-spin text-xl text-gray-200' >
                          <LuLoader/>
                      </h1> : "Submit"}
            </button>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceForm;
