
import LoginForm from '../components/LoginForm'

type LoginPageProps = {
  checkEmail: (email: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<void>
}

function LoginPage({ checkEmail, login }: LoginPageProps) {
  return <LoginForm checkEmail={checkEmail} login={login} />
}

export default LoginPage
