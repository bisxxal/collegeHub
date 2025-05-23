
import BigCalenderContainer from "@/components/custom/BigCalenderContainer";
import FormModal from "@/components/FormModal";
import Performance from "@/components/custom/Perfomance"; 
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
const SingleTeacherPage = async ({ params: { id },}: {params: { id: string };}) => {

  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const teacher: | (Teacher & { _count: { subjects: number; lessons: number; classes: number }; })| null = await prisma.teacher.findUnique({
  where: { id },
  include: {
    _count: {
      select: {
        subjects: true,
        lessons: true,
        classes: true,
        
      },
    },
  },
});

if (!teacher) {
  return notFound();
}

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row"> 
    <div className="w-full xl:w-2/3"> 
      <div className="flex flex-col lg:flex-row gap-4"> 
        <div className="  frame  py-6 px-4 rounded-2xl flex-1 flex gap-4">
          <div className="w-1/3">
            <Image
              src={teacher.img || "/avatar.jpg"}
              alt=""
              width={144}
              height={144}
              className="w-36 h-36 rounded-full object-cover"
            />
          </div>
          <div className="w-2/3 flex flex-col justify-between gap-4">
            <div className="flex items-center max-md:flex-col max-md:items-start gap-4">
              <h1 className="text-xl max:md-text-base font-semibold">
                {teacher.name + " " + teacher.surname}
              </h1>
              {role === "admin" && (
                <FormModal table="teacher" type="update" data={teacher} />
              )}
            </div>
           
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
             
              
              <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
               
                <span>{teacher.email || "-"}</span>
              </div>
              <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                
                <span>{teacher.phone || "-"}</span>
              </div>
            </div>
          </div>
        </div> 
        <div className="flex-1 flex gap-4 justify-between flex-wrap">
       
          <div className="bg-  frame p-4 rounded-2xl flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
        
            <div className="">
              <h1 className="text-xl font-semibold">
                {teacher._count.subjects}
              </h1>
              <span className="text-sm text-gray-400">Branches</span>
            </div>
          </div> 
          <div className="bg-  frame p-4 rounded-2xl flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
          
            <div className="">
              <h1 className="text-xl font-semibold">
                {teacher._count.lessons}
              </h1>
              <span className="text-sm text-gray-400">Lessons</span>
            </div>
          </div> 
          <div className="bg-  frame p-4 rounded-2xl flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
          
            <div className="">
              <h1 className="text-xl font-semibold">
                {teacher._count.classes}
              </h1>
              <span className="text-sm text-gray-400">Classes</span>
            </div>
          </div>
        </div>
      </div> 
      <div className="mt-4 bg-  frame rounded-2xl p-4">
        <h1>Teacher&apos;s Schedule</h1>
        <BigCalenderContainer type="teacherId" id={teacher.id} />
      </div>
    </div> 
    <div className="w-full xl:w-1/3 flex flex-col gap-4">
      <div className="bg-  frame p-4 rounded-2xl">
        <h1 className="text-xl font-semibold">Shortcuts</h1>
        <div className="mt-4 flex gap-4 flex-wrap text-xs text- gray-500">
         <Link
            className="p-3 rounded-2xl  border border-[#ffffff1c] frame2"
            href={`/list/classes?supervisorid=${teacher.id}`}
          >
            Teacher&apos;s Classes
          </Link>
          <Link
            className="p-3 rounded-2xl border border-[#ffffff1c] frame2 "
            href={`/list/students?classid=${teacher.id}`}
          >
            Teacher&apos;s Students
          </Link>
          <Link
            className="p-3 rounded-2xl border border-[#ffffff1c] frame2 "
            href={`/list/lessons?teacherid=${teacher.id}`}
          >
            Teacher&apos;s Lessons
          </Link>
          <Link
            className="p-3 rounded-2xl bg-pink-50 border border-[#ffffff1c] frame2"
            href={`/list/exams?teacherid=${teacher.id}`}
          >
            Teacher&apos;s Exams
          </Link>
          <Link
            className="p-3 rounded-2xl border border-[#ffffff1c] frame2 "
            href={`/list/assignments?teacherid=${teacher.id}`}
          >
            Teacher&apos;s Assignments
          </Link>
        </div>
      </div>
      
    </div>
  </div>
  );
};

export default SingleTeacherPage;