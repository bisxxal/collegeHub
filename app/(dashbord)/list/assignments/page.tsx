 
import Pagination from "@/components/custom/Pagination";
import Table from "@/components/custom/Table"; 
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Assignment, Class, Prisma, Subject, Teacher } from "@prisma/client";
  
import Bar from "@/components/custom/Bar";
import FormModal from "@/components/FormModal";

type AssignmentList = Assignment & {
  lesson: {
    subject: Subject;
    class: Class;
    teacher: Teacher;
  };
};

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;
  const collage = (sessionClaims?.metadata as { collage?: string })?.collage;

  const columns = [
    {
      header: "Subject Name",
      accessor: "name",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Due Date",
      accessor: "dueDate",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];
  
  const renderRow = (item: AssignmentList) => (
    <tr
      key={item.id}
      className=" rounded-xl tr overflow-hidden hover:overflow-hidden inshadow text-sm "
    >
      <td className="flex items-center gap-4 p-4">{item.lesson.subject.name}</td>
      <td>{item.lesson.class.name}</td>
      <td className="hidden md:table-cell">
        {item.lesson.teacher.name + " " + item.lesson.teacher.surname}
      </td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.dueDate)}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="assignment" type="update" data={item} />
              <FormModal table="assignment" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;
 

  const query: Prisma.AssignmentWhereInput = {CollageName :collage};

  query.lesson = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classid":
            query.lesson.classId = parseInt(value);
            break;
          case "teacherid":
            query.lesson.teacherId = value;
            break;
          case "search":
            query.lesson.subject = {
              name: { contains: value, mode: "insensitive" },
            };
            break;
          default:
            break;
        }
      }
    }
  }
 

  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.lesson.teacherId = currentUserId!;
      break;
    case "student":
      query.lesson.class = {
        students: {
          some: {
            id: currentUserId!,
          },
        },
      };
      break;
    
    default:
      break;
  }

  const [data, count] = await prisma.$transaction([
    prisma.assignment.findMany({
      where: query,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
            class: { select: { name: true } },
          },
        },
      },
      take: 10,
      skip: 10 * (p - 1),
    }),
    prisma.assignment.count({ where: query }),
  ]);
  return (
    <div className=" p-4 rounded-2xl flex-1 m-4 mt-0"> 
      <Bar role={role} table="assignment" type="create" data="All Assignments" />
        <Table columns={columns} renderRow={renderRow} data={data} />
        {data.length === 0 && <div className='text-center mt-10 text-lg '>No Assignment Found</div>}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AssignmentListPage;