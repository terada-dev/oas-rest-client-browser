import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUser } from '../api';

export default function LoginUser() {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<loginUser.Form, unknown, loginUser.Request>({
    resolver: zodResolver(loginUser.zodSchema()),
    defaultValues: loginUser.defaultValues(),
  });

  const onSubmit = async (data: loginUser.Request) => {
    const response = await loginUser(data);
    console.log("登録完了",  JSON.stringify(response));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-md">

      {/* username */}
      <div className="p-3">
        <label className="block">username</label>
        <input
          type="text"
          {...register('username')}
          className="border p-2 w-full"
        />
        {errors.username && (
          <p className="text-red-500 text-sm">{errors.username!.message}</p>
        )}
      </div>

      {/* password */}
      <div className="p-3">
        <label className="block">password</label>
        <input
          type="text"
          {...register('password')}
          className="border p-2 w-full"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password!.message}</p>
        )}
      </div>

      {/* submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 text-white p-2 rounded"
      >
        {isSubmitting ? "送信中..." : "登録"}
      </button>
    </form>
  );
}
